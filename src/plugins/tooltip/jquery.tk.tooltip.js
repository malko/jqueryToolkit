/**
* jquery toolkit plugin for handling tooltips
* @author Jonathan Gotti < jgotti at jgotti dot net >
* @licence Dual licensed under the MIT / LGPL licenses.
* @require tk.position
* @changelog
*            - 2011-03-18 - allow callback function for hideMethod and showMethod
*            - 2010-10-15 - avoid to apply opacity when connector is true under ie ( ie handling of opacity make the connector to disappear)
*            - 2010-08-30 - bugs correction regarding spacing and connector colors
*                         - added method tipWrapper (used with return_tipWrapper)
*                         - add option opacity;
*            - 2010-05-06 - bug correction regarding tooltips from title attribute
*            - 2010-03-30 - bug correction on connector display under ie8
*            - 2010-03-23 - add some aria attrs
*/
(function($){
$.toolkit('tk.tooltip',{
	msg:'',
	_wrapper:null,
	_msg:null,
	_pointer:null,
	_pointerBg:null,
	_classNameOptions:{
		stateClass:'|warning|success|error|info|normal|disabled',
		position:'|(inner|middle|upper|lower)?([tT]op|[Bb]ottom|[mM]iddle)-(middle|inner|left|right)?([lL]eft|[cC]enter|[rR]ight)?',
		stickyMouse:'|sticky'
	},
	_init:function(){
		var self = this,
			ttipId = "tooltip_"+self.elmt.prop('id');
		self._wrapper = $('<div class="tk-tooltip-wrapper tk-border tk-corner" role="tooltip" id="'+ttipId+'"><div class="tk-tooltip-msg"></div><div class="tk-pointer"><div class="tk-pointer-bg"><span>&nbsp;</span></div></div></div>');
		self.elmt.attr("aria-describedby", ttipId);
		self._msg = self._wrapper.find('.tk-tooltip-msg');
		self._pointer=self._wrapper.find('.tk-pointer');
		self._pointerBg=self._wrapper.find('.tk-pointer-bg');
		self._wrapper.appendTo('body')
			.positionRelative({related:this.elmt,edgePolicy:self.options.edgePolicy,borderPolicy:'out'})
		//- .mouseRelative({edgePolicy:self.options.edgePolicy,borderPolicy:'out',tracking:true})
			.bind('updatehpos updatevpos',function(){self._setPointerColor(true)});

		// inline options standardisation
		if( this.options.stateClass.match(/^(error|success|warning|info|normal|disabled)$/) ){
			this.options.stateClass = 'tk-state-'+this.options.stateClass
		}
		self._applyOpts('stateClass|position|connector|msg|width|height|showTrigger|hideTrigger|stickyMouse|opacity');

		this._setPointerColor(true);

	},
	tipWrapper:function (){
		return this._wrapper;
	},
	_set_opacity:function(o){
		//-- ie 6~8 bug when using opacity with connector (connector won't display) so we disable opacity if connector is true and we are under ie
		if( (! $.support.opacity) && this.options.connector )
			return;
		this._wrapper.css('opacity',o?o:1);
	},
	_set_stickyMouse:function(sticky){
		var self = this;
		if( sticky ){
			self._wrapper.mouseRelative('set','tracking',false);
			self._wrapper.bind('positionRelative_changerelated.'+self._tk.pluginName,function(e,elmt,related){
				if(related!==$.toolkit.mouseRelative.elmt){
					self._set_stickyMouse(false);
				}
			});
		}else{
			self._wrapper.unbind('positionRelative_changerelated.'+self._tk.pluginName);
			self._wrapper.positionRelative('set',{related:self.elmt});
		}
	},
	_set_position:function(pos){
		if( typeof pos==='string' )
			pos = pos.split('-');
		this._wrapper.positionRelative('set',{vPos:pos[0],hPos:pos[1]})
		this._setPointerColor(this._tk.initialized);
		this.options.position = pos;
		this._applyOpts('spacing');
		return pos;
	},
	/*_set_position:function(pos){
		if( typeof pos==='string' )
			pos = pos.split('-');
		this._wrapper.positionRelative('set',{vPos:pos[0],hPos:pos[1]})
		this._setPointerColor(this._tk.initialized);
		return;
		pos = pos.replace(/[TBRL]/,function(match){return '-'+match.toLowerCase()});
		//- $.toolkit._removeClassExp(this._wrapper,'tk-tooltip-pos-*','tk-tooltip-pos-'+pos);
		this._wrapper.removeClass('tk-tooltip-pos-'+this.options.position).addClass('tk-tooltip-pos-'+pos);
		this.options.position = pos;
		this._setPointerColor(this._tk.initialized);
		if( this._wrapper.is(':visible')){
			this._setDisplayPosition();
		}
		return pos;
	},*/
	_set_edgePolicy:function(p){
		this._wrapper.positionRelative('set_edgePolicy',p);
	},
	_set_spacing:function(s){
		var cSpace = (this.options.connector?16:0),
			space = {
				hSpace: (this.options.position[0] !== 'middle'?0:(s+cSpace)),
				vSpace: (s+cSpace)
			};
		this._wrapper.positionRelative('set',space);
		return s;
	},
	_set_width:function(w){
		this._wrapper.width(w);
	},
	_set_height:function(h){
		this._wrapper.height(h);
	},
	_set_stateClass:function(stateClass){
		this._wrapper.removeClass(this.options.stateClass).addClass(stateClass);
		this._setPointerColor(this._tk.initialized);
	},
	_set_connector:function(c){
		if( $.browser.msie && $.browser.version < 7){
			c=false;
		}
		this._pointer.toggle(this.options.connector=c?true:false);
		//this._wrapper.positionRelative('set_space',this.options.spacing+(this.options.connector?16:0));
		this._applyOpts('spacing');
		if( this._tk.initialized && c){
			this._setPointerColor(this.options.connector=c);
		}
		return c;
	},
	_set_msg:function(msg){
		if( msg.toString().length < 1){
			msg = this.elmt.attr('title');
			this.elmt.attr('title','');
		}
		this._msg.html(msg);
	},
	_set_showTrigger:function(eventName){
		if( null===eventName)
			return;
		var self = this;
		if( eventName instanceof Array ){
			for(var i=0,l=eventName.length;i<l;i++){
				self._set_showTrigger(eventName[i]);
			}
			return;
		}
		self.elmt.bind(eventName+'.'+self._tk.pluginName,function(e){self.show(e)});
	},
	_set_hideTrigger:function(eventName){
		if( null===eventName)
			return;
		var self = this;
		if( eventName instanceof Array ){
			for(var i=0,l=eventName.length;i<l;i++){
				self._set_hideTrigger(eventName[i]);
			}
			return;
		}
		self.elmt.bind(eventName+'.'+self._tk.pluginName,function(e){self.hide(e)});
	},
	/** correctly set pointer colors */
	_setPointerColor:function(doIt){
		if( ! doIt){ //-- prevent setting colors multiple times at init time
			return false;
		}
		if(! this.options.connector )
			return false;
		var pos=this._wrapper.positionRelative('return1_realpos'),
			bgColor = this._wrapper.css('backgroundColor');
		//-- reset inlineStyle (put something in it to get it work on ie8)
		this._pointer.attr('style','position:absolute;');
		this._pointerBg.attr('style','position:absolute;');
		switch(pos.v){
			case 'top':
				this._pointer.css('borderTopColor',this._wrapper.css('borderTopColor'));
				this._pointerBg.css('borderTopColor',bgColor);
				break;
			case 'bottom':
				this._pointer.css('borderBottomColor',this._wrapper.css('borderBottomColor'));
				this._pointerBg.css('borderBottomColor',bgColor);
				break;
			case 'middle':
				switch(pos.h){
					case 'left':
						this._pointer.css('borderLeftColor',this._wrapper.css('borderRightColor'));
						this._pointerBg.css('borderLeftColor',bgColor);
						break;
					case 'right':
						this._pointer.css('borderRightColor',this._wrapper.css('borderLeftColor'));
						this._pointerBg.css('borderRightColor',bgColor);
						break;
				}
				break;
		}
	},
	show:function(event){
		if( false === this._trigger('show',event)){
			return false;
		}
		$('.tk-tooltip-wrapper').not(this._wrapper[0]).hide();
		this._wrapper.stop(true,true);
		if( this._msg[0].innerHTML.length < 1){
			return false;
		}
		this._wrapper.positionRelative('update');
		if( this.options.stickyMouse ){
			this._wrapper.mouseRelative('set_tracking',true);
		}
		if( typeof(this.options.showMethod) === 'string'){
			this._wrapper[this.options.showMethod]();
		}else if( $.isFunction(this.options.showMethod) ){
			this.options.showMethod.call(this._wrapper,event);
		}else{
			this._wrapper[this.options.showMethod[0]](this.options.showMethod[1]);
		}
		this._wrapper.attr("aria-hidden", false);
		this._wrapper.positionRelative('update');
	},
	hide:function(event){
		if( false === this._trigger('hide',event)){
			return false;
		}
		this._wrapper.stop(true,true);
		if( this.options.stickyMouse ){
			this._wrapper.mouseRelative('set_tracking',false);
		}
		if( typeof(this.options.hideMethod) === 'string'){
			this._wrapper[this.options.hideMethod]();
		}else if( $.isFunction(this.options.hideMethod) ){
			this.options.hideMethod.call(this._wrapper,event);
		}else{
			this._wrapper[this.options.hideMethod[0]](this.options.hideMethod[1]);
		}
		this._wrapper.attr("aria-hidden", true);
	}

});

$.tk.tooltip.defaults={
	position:'top-center', // one of (top|bottom|middle)-(right|center|left)
	stateClass:'tk-state-warning', //  one of warning|error|success|info
	connector:true,
	edgePolicy:'opposite',
	stickyMouse:false,
	spacing:10,
	width:'auto',
	height:'auto',
	msg:'',
	opacity:false,// 0-100 based
	showTrigger:['focus','mouseenter'],// may be a single string eventName an array list of eventsNames or null
	hideTrigger:['blur','mouseleave'],
	showMethod:'show',//['fadeIn','fast'], //may be string or array methodName + duration
	hideMethod:'hide' // ['hide',0]
}

})(jQuery);