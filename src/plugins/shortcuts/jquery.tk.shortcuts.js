(function($){
	$.toolkit.keyCodes = {
		BACK_SPACE:8
		, TAB:9
		, ENTER:13
		, CAPS_LOCK:20
		, ESCAPE:27
		, SPACE:32
		, PAGE_UP:33
		, PAGE_DOWN:34
		, END:35
		, HOME:36
		, LEFT:37
		, UP:38
		, RIGHT:39
		, DOWN:40
		, INSERT:45
		, DELETE:46
		, 0:48
		, 1:49
		, 2:50
		, 3:51
		, 4:52
		, 5:53
		, 6:54
		, 7:55
		, 8:56
		, 9:57
		, A:65
		, B:66
		, C:67
		, D:68
		, E:69
		, F:70
		, G:71
		, H:72
		, I:73
		, J:74
		, K:75
		, L:76
		, M:77
		, N:78
		, O:79
		, P:80
		, Q:81
		, R:82
		, S:83
		, T:84
		, U:85
		, V:86
		, W:87
		, X:88
		, Y:89
		, Z:90
		, CONTEXT_MENU:93
		, NUMPAD_0:96
		, NUMPAD_1:97
		, NUMPAD_2:98
		, NUMPAD_3:99
		, NUMPAD_4:100
		, NUMPAD_5:101
		, NUMPAD_6:102
		, NUMPAD_7:103
		, NUMPAD_8:104
		, NUMPAD_9:105
		, NUMPAD_MULTIPLY:106
		, NUMPAD_ADD:107
		, NUMPAD_ENTER:108
		, NUMPAD_SUBTRACT:109
		, NUMPAD_DECIMAL:110
		, NUMPAD_DIVIDE:111
		, F1:112
		, F2:113
		, F3:114
		, F4:115
		, F5:116
		, F6:117
		, F7:118
		, F8:119
		, F9:120
		, F10:121
		, F11:122
		, F12:123
		, COMMA:188
		, ',':188
		, PERIOD:190
		, '.':190
	}
	$.toolkit('tk.shortcut',{
		_shortcuts:null
		,_init:function(){
			var self=this;
			self._bind('keydown',function(e){ return self._callback(e);});
			self._shortcuts=[];
			for(var a=0,c,m,s;a<2;a++){
				self._shortcuts[a] = [];
				for(c=0;c<2;c++){
					self._shortcuts[a][c] = [];
					for(s=0;s<2;s++){
						self._shortcuts[a][c][s] = {};
					}
				}
			}
			// bind all shortcuts passed as options
			for(var i in self.options){
				self.bind(i,self.options[i]);
			}
		}
		,_getKeys:function(s){
			var keys;
			if( typeof s === 'string' ){
				keys = { Alt:s.match(/\bAlt\b/)?1:0
					, Ctrl:s.match(/\bCtrl\b/)?1:0
					, Shift:s.match(/\bShift\b/)?1:0
					, key:s.replace(/^.*?\b([a-zA-Z_0-9]+)$/,'$1')
				};
				keys.keyCode=( typeof $.toolkit.keyCodes[keys.key] === 'undefined')?keys.key:$.toolkit.keyCodes[keys.key];
			}else{ // consider to work on an event
				keys = {
					Alt:s.altKey?1:0
					,Ctrl:(s.ctrlKey || s.metaKey)?1:0
					,Shift:s.shiftKey?1:0
					,key:s.which
					,keyCode:s.which
				};
				for( var i in $.toolkit.keyCodes ){
					if( keys.key === $.toolkit.keyCodes[i] ){
						keys.key=i;
					}
				}
			}
			return keys;
		}
		,one:function(shortcut,cb){
			var keys = this._getKeys(shortcut);
			if( typeof this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode] === 'undefined' ){
				this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode] = [];
			}
			for(var i=0,l=this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode].length;i<l;i++){
				if( $.isArray(this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode][i]) && this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode][i][0]===cb){
					return;
				}
			}
			this.bind(shortcut,[cb]);
		}
		,bind:function(shortcut,cb){
			if( undefined === cb && typeof shortcut === 'object' ){
				for(var i in shortcut){
					this.bind(i,shortcut[i]);
				}
				return;
			}
			var keys = this._getKeys(shortcut);
			if( typeof this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode] === 'undefined' ){
				this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode] = [];
			}
			this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode].push(cb);
		}
		,unbind:function(shortcut,cb){
			var keys = this._getKeys(shortcut);
			if( typeof this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode] === 'undefined' ){
				return;
			}
			for(var res,ks=this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode],i=0,l=ks.length;i<l;i++){
				if( ks[i] === cb){
					res = ks.slice(i+1);
					this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode].length = i ;
					this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode].push.apply(this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift][keys.keyCode],res);
					break;
				}
			}
			// nothing unbound try to unbound a one
			if(! $.isArray(cb) ){
				this.unbind(shortcut,[cb]);
			}
		}
		,_callback:function(e){
			var keys = this._getKeys(e)
				, cbs = this._shortcuts[keys.Alt][keys.Ctrl][keys.Shift];
			if( ! ( cbs[keys.keyCode] && cbs[keys.keyCode].length) ){
				return ;
			}
			for(var i=0,l=cbs[keys.keyCode].length,res;i<l;i++){
				if(! $.isArray(cbs[keys.keyCode][i]) ){
					res = cbs[keys.keyCode][i].call(this.elmt,e);
				}else{ // this is a one
					res = cbs[keys.keyCode][i][0].call(this.elmt,e);
					this.unbind((keys.Alt?'Alt+':'')+(keys.Ctrl?'Ctrl+':'')+(keys.Shift?'Shift+':'')+keys.key,cbs[keys.keyCode][i]);
				}
				if( false===res ){
					return false;
				}
			}
		}
	});

	$.toolkit('tk.accelkey',{
		_classNameOptions:{
			preventDefault:'|(no)?[Pp]reventDefault'
			,event:'|focus|click'
			,meta:'(-?(Alt|Ctrl|Shift))*'
			,key:(function(){ var res=[];for(var i in $.toolkit.keyCodes){res.push(i);} return res.join('|'); })()
		}
		,__shortcut:null
		,_init:function(){
			var self = this;
			self._applyOpts('preventDefault|meta|event');
			self._cb = function(e){	return self.__callback(e);};
			self._tk.initialized=true;
			//self._applyOpts('key'); // don't understand why i must rebind this using ready even when instantiating from ready event. If you know why please contact and explain me
			$(function(){self._applyOpts('key');});
		}
		,set_shortcut:function(s){
			var self = this;
			if(! self._tk.initialized ){
				return false;
			}
			if( self.__shortcut !== null){
				$(self.elmt[0].ownerDocument).shortcut('unbind',self.__shortcut,self._cb);
			}
			self.__shortcut = s;
			$(self.elmt[0].ownerDocument).shortcut('bind',self.__shortcut,self._cb);
		}
		,_set_preventDefault:function(p){
			if( typeof p === 'string' && p.match(/^nopreventdefault/i) ){
				return false;
			}
			return p?true:false;
		}
		,_set_meta:function(m){
			this.set_shortcut(m+'+'+this.options.key);
			return m;
		}
		,_set_key:function(k){
			this.set_shortcut(this.options.meta+'+'+k);
			return k;
		}
		,__callback:function(e){
			this.elmt.trigger(this.options.event);
			if( this.options.preventDefault){
				e.preventDefault();
				return false;
			}
		}
	});
	$.tk.accelkey.defaults = {
		event:'click'
		,meta:'Ctrl'
		,preventDefault:true
		,key:''
	}
})(jQuery)