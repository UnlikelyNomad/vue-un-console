(function() {

//root of emulated console
Vue.component('un-console', {
  template: '\
  <div class="un-console" ref="outer" :style="{width: width, height: height}">\
    <un-console-log ref="log" :defaultColor="defaultColor"></un-console-log>\
    <un-console-echo :captured="captured" :disabled="disabled" :text="currentInput" :echoColor="echoColor" ref="echo"></un-console-echo>\
    <!--<un-console-scanlines></un-console-scanlines>-->\
    <un-console-input @captureInput="captureInput" @releaseInput="releaseInput" @key="key"></un-console-input>\
  </div>\
  ',
  
  props: [
    'width',
    'height'
  ],
  
  data: function() {
    return {
      currentInput: '',
      commands: [],
      currentHistory: 0,
      captured: false,
      disabled: true,
      echoColor: '#EEE',
      defaultColor: '#DDD',
    };
  },
  
  computed: {
  },
  
  methods: {
    key: function(val) {
      this.scroll();
      
      if (this.disabled) {
        return;
      }
      
      switch (val) {
      case 'Backspace':
        this.currentInput = this.currentInput.slice(0, this.currentInput.length - 1);
        break;
      
      case 'UpArrow':
        this.currentHistory = this.currentHistory - 1;
        if (this.currentHistory < -this.commands.length) {
          this.currentHistory = -this.commands.length;
        } else {
          this.currentInput = this.commands[this.commands.length + this.currentHistory];
        }
        break;
        
      case 'DownArrow':
        this.currentHistory = this.currentHistory + 1;
        if (this.currentHistory > 0) {
          this.currentHistory = 0;
        } else if (this.currentHistory == 0) {
          this.currentInput = '';
        } else {
          this.currentInput = this.commands[this.commands.length + this.currentHistory];
        }
        break;
        
      case 'Enter':
        this.$refs.log.add(this.$refs.echo.prompt + this.currentInput, this.echoColor);
        
        this.commands.push(this.currentInput);
        this.$emit('command', this.currentInput);
        
        if (this.commands.length > 100) {
          this.commands.shift();
        }
        
        this.currentHistory = 0;
        
        this.currentInput = '';
        break;
        
      default:
        this.currentInput += val;
        break;
      }
    },
    
    captureInput: function() {
      this.captured = true;
    },
    
    releaseInput: function() {
      this.captured = false;
    },
    
    scroll: function() {
      setTimeout(function() {this.$refs.outer.scrollTop = this.$refs.outer.scrollHeight;}.bind(this), 0);
    },
    
    addLine: function(text, color) {
      this.$refs.log.add(text, color);
      
      this.scroll();
    },
    
    disable: function() {
      this.disabled = true;
    },
    
    enable: function() {
      this.disabled = false;
    },
    
    setEchoColor: function(color) {
      this.echoColor = color;
    },
    
    setDefaultColor: function(color) {
      this.defaultColor = color;
    },
  },
    
});

Vue.component('un-console-log', {
  template: '\
  <div class="un-console-log">\
    <div class="un-console-entry" v-for="item in entries" v-key="item.id" :style="{color: item.color}">{{item.entry}}</div>\
  </div>\
  ',
  
  props: [
    'maxEntries',
    'defaultColor',
  ],
  
  data: function() {
    return {
      id: 0,
      entries: [],
    };
  },
  
  methods: {
    add: function(text, color) {
      if (typeof color == 'undefined') {
        color = '#CCC';
      }
      
      this.entries.push({id: this.id, entry: text, color: color});
      this.id = this.id + 1;
      
      var max = this.maxEntries;
      if (!max) {
        max = 100;
      }
      
      if (this.entries.length > max) {
        this.entries.shift();
      }
    },
  },
});

Vue.component('un-console-echo', {
  template: '\
    <div class="un-console-echo" :style="echoStyle">{{echoText}}</div>\
  ',
  
  props: [
    'disabled',
    'text',
    'captured',
    'echoColor',
  ],
  
  data: function() {
    return {
      prompt: '>',
      cursor: '_',
      blink: 500,
      timer: 0,
      toggle: true
    };
  },
  
  computed: {
    echoStyle: function() {
      var s = {
        display: (this.disabled ? 'none' : 'block'),
        color: this.echoColor,
      };
      
      return s;
    },
    
    cursorVisible: function() {
      return (this.captured && this.toggle);
    },
    
    echoText: function() {
      return this.prompt + this.text + (this.cursorVisible ? this.cursor : '');
    }
  },
  
  methods: {
    toggleCursor: function() {
      this.toggle = !this.toggle;
      this.timer = setTimeout(this.toggleCursor.bind(this), this.blink);
    }
  },
  
  mounted: function() {
    this.timer = setTimeout(this.toggleCursor.bind(this), this.blink);
  },
  
  beforeDestroy: function() {
    clearTimeout(this.timer);
  },
});

Vue.component('un-console-scanlines', {
  template: '\
    <div class="un-console-scanlines" ref="scanlines"></div>\
  ',
  
  methods: {
    resize: function() {
      var i = this.$refs.scanlines;
      var p = i.parentNode;
      i.style.width = p.clientWidth;
    },
  },
  
  mounted: function() {
    window.addEventListener('resize', this.resize.bind(this));
  },
});

Vue.component('un-console-input', {
  template: '\
  <input type="text" ref="input" class="un-console-input" @keydown.delete="bs" @keydown.up="up" @keydown.down="down" @keypress="keypress" @focus="captureInput" @blur="releaseInput">\
  ',
  
  methods: {
    bs: function(evt) {
      evt.preventDefault();
      //Also captures delete key which we're ignoring
      if (evt.key == 'Backspace') {
        this.$emit('key', 'Backspace');
      }
    },
    
    up: function(evt) {
      evt.preventDefault();
      this.$emit('key', 'UpArrow');
    },
    
    down: function(evt) {
      evt.preventDefault();
      this.$emit('key', 'DownArrow');
    },
    
    keypress: function(evt) {
      evt.preventDefault();
      this.$emit('key', evt.key);
    },
    
    captureInput: function() {
      this.$emit('captureInput');
    },
    
    releaseInput: function() {
      this.$emit('releaseInput');
    },
    
    resize: function() {
      var i = this.$refs.input;
      var p = i.parentNode;
      i.style.width = p.clientWidth;
    },
  },
  
  mounted: function() {
    window.addEventListener('resize', this.resize.bind(this));
  },
});

})();
