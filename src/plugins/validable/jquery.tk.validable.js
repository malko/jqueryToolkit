/**
Simple client side Help/Validation for forms

each input can use an 'inputValidableOptions' that look like this:
inputValidableOptions = {
	rule: /regexp/,       // optional valid RegExp or callback function
	help: 'help message', // optionnal the tooltip message to display when input is focused
	minlength: 5,         // optional minimal length
	maxlength: 25,        // optional maximal length if not passed may be detected in input attribute if set
	required:true,        // optional make the input must have a non empty value to pass validation.
	helpTrigger:'jquerySelector',// allow to attach focus/blur event to display the help message to other elements
	helpAfter:'jquerySelector' // allow to move help and icon display after another element than the original one.
};
and may be added at any time to the script by doing
$('#inputId').validable(inputValidableOptions);

you may declare all validations rules at once by making the parent form validable (u must make it validable anyway if you want to check before submit)
here the options for validable form declaration:
formValidableOptions = {
	rules:{
		inputName: inputValidableOptions,
		inputName1: inputValidableOptions1,
		...
	}
};
$('#myForm').validable(formValidableOptions);
@changelog
	- 2013-01-10 - add support for novalidate attribute on html5 forms elements (default to true)
	- 2012-03-13 - add support for pattern attribute
	- 2010-10-05 - add mustValidate to required classNameOption
	- 2010-07-30 - validable_formGetState only trigger when initialized
	- 2010-06-30 - add getStateAutoScroll option
							 - getState on form now ignore disabled elements
							 - propagate event thrue getState validation callbacks (second parameters)
	- 2010-06-10 - add ualpha[num] methods for checking input alphanum chars without accented chars and single quote
	- 2010-06-09 - add confirm method as predefined defaultRules
	- 2010-05-14 - remove eval on unknown callback rule assignation (replaced by new Function)
	- 2010-05-10 - add possibility for null/'none' as stateElmt option value
							 - bug correction checking empty select sets
	- 2010-04-02 - form.validable will force any :input with a tk-validable* class to be promotted to validable widget nevermind the alwaysSetState option
	- 2010-04-01 - add _classNameOptions
							 - add @title support and make it default value for help option
							 - some bug correction
	- 2010-03-31 - add required:-1 option and correctly remove tk-required class when set to false
	- 2010-03-30 - check radio/checkbox are checked when required
							 - add event validable_formGetState(event,elmt,state) emitted on form checking state; (stop submission if return false)
	- 2009-10-22 - add options helpTrigger and helpAfter
	- 2009-10-20 - add support for string callbacks
@knownBugs
 - trying to make validable a form with no id attribute but with an input named id will lead to problem under fucking buggy internet explorer
   to workaround either use a different name for your input element or simply declare an id attribute to your form in the original html code
*/
(function($) {
	$.toolkit('tk.validable',{
		_classNameOptions: {
			getStateAutoScroll:'|noScroll|autoScroll',
			alwaysSetState:'|all',
			required:'|req|opt|mustValidate',
			useIcon:'|noIcon|withIcon',
			initCheck:'|noInitCheck',
			stateElmt:'|self|label|none',
			rule:'|[a-zA-Z0-9_]+?'
		},
		_requiredElmt:null,
		_stateIconElmt:null,
		_labelElmt:null,
		_init:function(){
			var self = this,
				id = self.elmt.attr('id'),
				getStateCB=function(e){return self.getState(e)};
			if(self.options.getStateAutoScroll==='noScroll' || self.options.getStateAutoScroll==='autoScroll' ){
				self.options.getStateAutoScroll = self.options.getStateAutoScroll ==='noScroll'?false:true;
			}
			if(self.options.alwaysSetState==='all'){
				self.options.alwaysSetState = true;
			}
			if( self.elmt.is('form')){
				var dfltInputOptions= $.extend({},self.options);
				delete dfltInputOptions.rules;
				if( self.options.novalidate ){
					self.elmt.attr('novalidate','novalidate');
				}
				if(! self.options.rules){
					self.options.rules = {};
				}
				self.elmt.find(':input:not(button,[type=submit],[type=reset],[type=hidden])').each(function(){
					var input=$(this)
						,inlineOpts = $.extend({},dfltInputOptions,$.toolkit._readClassNameOpts(input,'tk-validable',self._classNameOptions))
						iname = input.attr('name')
					;
					if(! iname ){
						return;
					}
					iname = iname.replace(/\[.*$/,'');
					if( self.options.rules[iname]){
						input.validable($.extend({},inlineOpts,self.options.rules[iname]));
					}else if(self.options.alwaysSetState || input.is('[class*=tk-validable]')){
						input.validable(inlineOpts);
					}
				});
				self.elmt.bind('submit.validable',getStateCB);
			}else{
				delete self.options.alwaysSetState; //-- only for form elements
				if( ! self.options.maxlength ){
					var maxl = self.elmt.attr('maxlength');
					self.options.maxlength = ( typeof(maxl)===undefined || isNaN(maxl) || maxl<0 )? 0 : maxl;
				}
				if( ! self.options.minlength ){
					var minl = self.elmt.attr('minlength');
					self.options.minlength = ( typeof(minl)===undefined || isNaN(minl) || minl<0 )? 0 : minl;
				}
				self._applyOpts('minlength|maxlength',true);
				self._applyOpts('labelElmt|rule|required|useIcon|help|helpTrigger|helpAfter');
				//- check trigger
				self.elmt.bind('change.validable, keyup.validable, focus.validable, blur.validable',getStateCB);
			}
			if( self.options.initCheck ==="noInitCheck"){
				self.options.initCheck=false;
			}
			if(self.options.initCheck){
				var autoScroll = self.options.getStateAutoScroll;
				self.options.getStateAutoScroll = false;
				self.getState();
				self.options.getStateAutoScroll = autoScroll;
			}
		},
		_set_labelElmt:function(label){
			var self = this;
			if( label ){
				self._labelElmt = $(label);
			}else{
				label =$('label[for='+self.elmt.attr('id')+']');
				if(! label.length){
					label = self.elmt.parents('label');
				}
				self._labelElmt = label.length?label:null;
			}
			return label;
		},
		_set_rule:function(rule){
			var self = this;
			if( !rule && self.elmt.attr('pattern') ){
				rule = "/^"+self.elmt.attr('pattern')+'$/';
			}
			if( typeof rule === 'string' ){
				var isRegExpString = rule.match(/^\/(.+)\/([mgi]{0,3})?$/);
				if(  isRegExpString ){
					rule = isRegExpString[2]? new RegExp(isRegExpString[1],isRegExpString[2]) : new RegExp(isRegExpString[1]);
				}else if( $.tk.validable.defaultRules[rule] ){
					rule = $.tk.validable.defaultRules[rule];
				}else{ //-- consider this as a callback function name
					try{
						rule = $.isFunction(rule)?rule:new Function('return '+rule+'.apply(this,arguments);');
					}catch(e){
						throw(rule+' is not a valid validable rule.');
					}
				}
			}
			return rule;
		},
		_set_maxlength:function(l){ l=Math.max(0,l); this.elmt.attr('maxlength',l?l:''); },
		_set_minlength:function(l){ l=Math.max(0,l); this.elmt.attr('minlength',l?l:''); },
		_set_required:function(required){
			var self = this;
			if( required === 'req'){
				required = true;
			}else if( required === 'opt'){
				required = false;
			}else if( required==='mustValidate'){
				required = -1;
			}
			required = required==-1?-1:(required?true:false); // ensure boolean value or -1
			if( required !== true){
				if(null!==self._requiredElmt){
					self._requiredElmt.remove();
					if( self._labelElmt ){
						self._labelElmt.removeClass('tk-required');
					}else{
						self.elmt.removeClass('tk-required');
					}
				}
				self._requiredElmt=null;
			}else{
				if(null===self._requiredElmt){
					self._requiredElmt = $(self.options.requiredTemplate);
				}
				if( self._labelElmt){
					if( !self._labelElmt.is('.tk-required') ){
						self._labelElmt.prepend(self._requiredElmt).addClass('tk-required');
					}
				}else{
					self.elmt.after(self._requiredElmt).addClass('tk-required');
				}
			}
			return required;
		},
		_set_useIcon:function(useIcon){ //@todo manage "auto" value
			if( useIcon==='auto' ){
				useIcon = this._hasRule()?true:false;
			}
			if( useIcon==='noIcon' || ! useIcon){
				if( this._stateIconElmt !== null){
					this._stateIconElmt.remove();
					this._stateIconElmt=null;
				}
				return false;
			}else{
				if( this._stateIconElmt === null){
					this._stateIconElmt=$('<span class="tk-validable-state-icon"><span class="ui-icon"></span></span>');
					this._applyOpts('helpAfter');
				}
				return true;
			}
		},
		_set_help:function(msg){
			if( msg==='@title' && this.elmt.is('[title]')){
				msg = this.elmt.attr('title');//.replace(/\\n/,'<br />');
			}
			if( msg==='@title' || ! msg.length){
				return '';
			}
			var o = $.extend({},this.options.helpOptions,{msg:msg});
			this.elmt.tooltip('set',o);
			if( this._tk.initialized ){
				this.options.help = msg;
				this.getState();
			}else{
				return msg;
			}
		},
		_set_helpTrigger:function(trigger){
			if( trigger === null || this.options.help.length<1){
				$(trigger).each(function(){ $(this).unbind('.validable'); });
				return null;
			}
			var self = this;
			$(trigger).each(function(){
				if( this.tagName==='IFRAME' && this.contentDocument){ // @todo check for aleternate method for IE
					//- this.contentDocument.addEventListener('focus',function(){self.getState();self.elmt.tooltip('show');},false);
					//- this.contentDocument.addEventListener('blur',function(){self.getState();self.elmt.tooltip('hide');},false);
					$(this.contentDocument).bind('focus.validable mouseover.validable',function(){self.getState();self.elmt.tooltip('show');});
					$(this.contentDocument).bind('blur.validable mouseout.validable',function(){self.getState();self.elmt.tooltip('hide');});
				}else{
					$(this).bind('focus.validable mouseover.validable',function(){self.getState();self.elmt.tooltip('show');})
						.bind('blur.validable mouseout.validable',function(){self.getState();self.elmt.tooltip('hide');});
					//- $(this).focus(function(){self.check();self.elmt.tooltip('show');})
						//- .blur(function(){self.check();self.elmt.tooltip('hide');});
				}
			});
			return trigger;
		},
		_set_helpAfter:function(elmt){
			if( null===elmt){
				elmt = this.elmt;
			}
			if( this.options.help.length && ! this.elmt.tooltip('get1_stickyMouse') ){
				$.toolkit._getInstance(this.elmt,'tk.tooltip')._wrapper.positionRelative('set_related',elmt);
			}
			if( ! this._stateIconElmt ){
				return;
			}
			this._stateIconElmt.insertAfter(elmt);
		},
		/**
		internal method to visually set the state of the stateElement, the stateIcon and tooltip
		*/
		_setState:function(state){
			var stateElmt = this.getStateElmt();
			if(state){
				if( null !== stateElmt){
					stateElmt.removeClass('tk-state-error')
						.addClass('tk-state-success');
				}
				if( this._stateIconElmt){
					this._stateIconElmt.removeClass('tk-state-error ui-state-error').addClass('tk-state-success ui-state-success')
					.find('.ui-icon').removeClass('ui-icon-cancel').addClass('ui-icon-check');
				}
				if( this.options.help.length>0 && this._hasRule()){
					this.elmt.tooltip('set_stateClass','tk-state-success');
				}
			}else{
				if( null !== stateElmt){
					stateElmt.removeClass('tk-state-success')
						.addClass('tk-state-error');
				}
				if( this._stateIconElmt){
					this._stateIconElmt.removeClass('tk-state-success ui-state-success').addClass('tk-state-error ui-state-error')
					.find('.ui-icon').removeClass('ui-icon-check').addClass('ui-icon-cancel');
				}
				if( this.options.help.length>0 && this._hasRule()){
					this.elmt.tooltip('set',{stateClass:'tk-state-error'});
				}
			}
			if( this.stateIconElmt){
				this._stateIconElmt.toggle((this.options.rule || this.options.required || this.options.minlength || this.options.maxlength)?true:false);
			}
			return state?true:false;
		},
		/*
		internal method to test if there's any kind of rules to apply (length/rule/required)
		*/
		_hasRule:function(){
			return (this.options.maxlength || this.options.minlength || this.options.required || this.options.rule)?true:false;
		},
		getStateElmt:function(){
			var stateElmt = this.elmt;
			if( this.options.stateElmt==='label' && this._labelElmt ){
				stateElmt = this._labelElmt;
			}else if( this.options.stateElmt !== 'self' && this.options.stateElmt!=='label'){
				if( null === this.options.stateElmt || 'none' === this.options.stateElmt ){
					stateElmt = null;
				}else{
					stateElmt = $(this.options.stateElmt);
					if( ! stateElmt.length){
						stateElmt=this.elmt;
					}
				}
			}
			return stateElmt;
		},
		getState: function(event){
			var self = this;
			if(! self.elmt.is(':input')){
				if(! self.elmt.is('form')){
					return false;
				}
				var res = true,i=0;
				self.elmt.find(':input.tk-validable:not(:disabled)').each(function(){
					res = (res && $(this).validable('return1_getState',event))?true:false;
					if( res===false){
						var elmt=$(this), stateElmt = elmt.validable('return1_getStateElmt');
						//-- print an error message
						//- if(self._tk.initialized && i===0 && self.options.errorMsg.length ){
							//- self.__printErrorMsg(elmt.options.helpAfter!==null?elmt.options.helpAfter:elmt);
						//- }
						//scroll to first error element
						if(self.options.getStateAutoScroll && i===0){
							var top=null,wTop = $(window).scrollTop();
							if( stateElmt.length ){
								top = stateElmt.offset().top;
							}else if( elmt.is(':visible') ){
								top = elmt.offset().top;
							}
							if( wTop > top || (wTop+$(window).height()) < top){
								$(window).scrollTop(top-20);
							}
						}
						i++;
					}
				});

				if( self._tk.initialized && false === self._trigger('formGetState', event,[self.elmt,res]) ){
					return false;
				}
				return res;
			}else{
				if( event && event.type === 'keyup' && event.which == 27 ){
					self.elmt.tooltip('hide');
				}
			}

			if(! self._hasRule() ){
				return self.options.alwaysSetState?self._setState(true):true;
			}
			var val   = self.elmt.val(),
				len= val?val.length:0;
			if( len < 1 && self.options.required===false){
				return self._setState(true);
			}
			if( self.options.maxlength && len > self.options.maxlength ){
				return self._setState(false);
			}
			if( self.options.minlength && len < self.options.minlength ){
				return self._setState(false);
			}
			if( self.options.rule instanceof RegExp){
				var m = val.match(self.options.rule);
				return self._setState(m===null?false:true);
			}else if(self.options.rule){ //	if( typeof self.options.rule === 'function'){
				try{
					var res = self.options.rule.call(self.elmt.get(0),val,event);
				}catch(e){
					throw(self.options.rule +' is not a valid validable rule.'+e);
				}
				if(! res ){
					return self._setState(false);
				}
			}
			if( self.options.required === true){
				var type= self.elmt.is('select')?'select':(self.elmt.is('textarea')?'textarea':self.elmt.attr('type'));
				switch( type.toLowerCase()){
					case 'radio':
					case 'checkbox':
						// check one at least is checked
						if($('input[name='+self.elmt.attr('name')+']:checked').length > 0)
							return self._setState(true);
						return self._setState(false);
						break;
					default:
						return self._setState(len > 0?true:false);
				}
			}
			return self._setState(true);

		}
	});

	$.tk.validable.defaults={
		rule: null,
		initCheck:true,
		alwaysSetState:false,
		getStateAutoScroll:true, // bool, only available for formElements if true then will jump to the first stateElment visible that trigger an error
		required:false, // true or false, special value -1 may be applyed to leave the rule do the job even on empty values
		minlength:0,
		maxlength:0,
		stateElmt:'self', //-- may be self, label or any valid selector null or 'none' for not set state on any elmt
		useIcon:'auto',
		labelElmt:null,
		requiredTemplate:'<span class="tk-validable-required"> * </span>',
		help:'@title', //-- by default will check for title attr value
		helpTrigger:null,
		helpAfter:null,
		//- errorMsg:'', // message to display on error
		helpOptions:{
			position:'middle-right',
			stickyMouse:false,
			edgePolicy:'opposite'
		},
		novalidate:true

	};

	if( typeof removeAccents === 'undefined'){
		var accentTable = {
			'µ':'u',
			'À':'A', 'Á':'A', 'Â':'A', 'Ã':'A', 'Ä':'A', 'Å':'A', 'Æ':'AE',
			'Ç':'C', 'È':'E', 'É':'E', 'Ê':'E', 'Ë':'E',
			'Ì':'I', 'Í':'I', 'Î':'I', 'Ï':'I', 'Ð':'D', 'Ñ':'N',
			'Ò':'O', 'Œ':'OE', 'Ó':'O','Ô':'O', 'Õ':'O', 'Ö':'O', 'Ø':'O',
			'Ù':'U', 'Ú':'U', 'Û':'U', 'Ü':'U', 'Ý':'Y', 'ß':'s',
			'à':'a', 'á':'a', 'â':'a', 'ã':'a', 'ä':'a', 'å':'a', 'æ':'ae',
			'ç':'c', 'è':'e', 'é':'e', 'ê':'e', 'ë':'e',
			'ì':'i', 'í':'i', 'î':'i', 'ï':'i', 'ñ':'n',
			'ð':'o', 'œ':'oe', 'ò':'o','ó':'o', 'ô':'o', 'õ':'o', 'ö':'o', 'ø':'o',
			'ù':'u', 'ú':'u', 'û':'u', 'ü':'u', 'ý':'y', 'ÿ':'y',
			'’':'\'','`':'\''
		},
		accentExp=[];
		removeAccents = function(str){
			if( accentExp instanceof Array){
				for(var c in accentTable){
					accentExp.push(c);
				}
				accentExp = new RegExp('('+accentExp.join('|')+')','g');
			}
			return str.replace(accentExp,function(m,c){
				return accentTable[c];
			});
		};
	}

	$.tk.validable.defaultRules={
		email:/^[^@\s]+@[^@\s]+\.[a-z]{2,5}$/
		, url:/^https?:\/\/[^\.\/]+\.[^\.\/]+/
		, 'int':/^\d+$/
		, 'float':/^\d+((\.|,)\d+)?$/
		, zipcode:/^\d{2,5}$/
		, phone:/^\d{10}$/
		, alpha:function(str){ return removeAccents(str).match(/^[a-z_\s-']+$/)?true:false }
		, Alpha:function(str){ return removeAccents(str).match(/^[a-z_\s-']+$/i)?true:false }
		, ALPHA:function(str){ return removeAccents(str).match(/^[A-Z_\s-']+$/)?true:false }
		, alphanum:function(str){ return removeAccents(str).match(/^[0-9a-z_\s-']+$/)?true:false }
		, Alphanum:function(str){ return removeAccents(str).match(/^[0-9a-z_\s-']+$/i)?true:false }
		, ALPHANUM:function(str){ return removeAccents(str).match(/^[0-9A-Z_\s-']+$/)?true:false }
		, ualpha:function(str){ return str.match(/^[a-z_\s-]+$/)?true:false }
		, uAlpha:function(str){ return str.match(/^[a-z_\s-]+$/i)?true:false }
		, uALPHA:function(str){ return str.match(/^[A-Z_\s-]+$/)?true:false }
		, ualphanum:function(str){ return str.match(/^[0-9a-z_\s-]+$/)?true:false }
		, uAlphanum:function(str){ return str.match(/^[0-9a-z_\s-]+$/i)?true:false }
		, uALPHANUM:function(str){ return str.match(/^[0-9A-Z_\s-]+$/)?true:false }
		, confirm:function(v){ var val = $($(this).attr('rel')).val(); return ( val==='' || val===v)?true:false; }
		, img:/\.(jpe?g|gif|png)$/i
		, video:/\.(mpe?g|avi|flv|mov)$/i
		, flashEmbeddable:/\.(jpe?g|flv|gif|png|swf|mp3)$/i
	};
	//add defaults validable rules to classNameOptions
	//$.tk.validable.prototype._classNameOptions.rule=(function(){var r,res=[];for(r in $.tk.validable.defaultRules){res.push(r);} return '|'+res.join('|');})()
})(jQuery);