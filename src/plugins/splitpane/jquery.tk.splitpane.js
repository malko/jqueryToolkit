/**
plugin for splitPane implementation
@author jonathan gotti <jgotti at jgotti dot net>
@licence Dual licensed under the MIT / GPL licenses.
@since 2010-11
*/
(function(){
$.toolkit('tk.paneSplitter',{
	_classNameOptions:{
		 min:"|\\d+"
		,max:"|\\d+"
		,opened:"|opened|closed"
		,size:"|\\d+"
	},
	_storableOptions:{
		urlElementLevel:'opened|size'
	},
	_init:function(){
		var self = this;
		self.elmt.append('<span class="tk-paneSplitter-spacer"></span>');
		self.prev=self.elmt.prev('.'+$.tk.splitpane._tk.baseClass+'-pane');
		self.next=self.elmt.next('.'+$.tk.splitpane._tk.baseClass+'-pane');
		self.capturePos = {start:{top:0,left:0},min:{top:0,left:0},max:{top:0,left:0},moved:false};
		self.elmt.bind('mousedown.paneSplitter',function(e){
			return self.startCapture(e);
		})
		.bind('mouseup.paneSplitter',function(e){ self.stopCapture(e); e.preventDefault();});
		//.bind('click.paneSplitter',function(e){ if( !self.capturePos.moved ){self.toggle(e);} });
		//-- create clone node for visual resizing
		self.clone = self.elmt.clone().appendTo(self.elmt).addClass('tk-paneSplitter-held').css({
			opacity:.6,
			position:'absolute',
			display:'none',
			top:0,
			left:0
		});
		self._applyOpts('orientation|primary|min|max|opened|size|toggleSpeed');
		self._tk.initialized=true;
		self.__checkSize(true);
	},
	/** setters */
	_set_orientation:function(o){
		$.toolkit._removeClassExp(this.elmt,this._tk.baseClass+'-orientation-*',this._tk.baseClass+'-orientation-'+o);
		//- this.elmt.css({'height':'','width':''});
		this.options.orientation = o;
		this.__checkSize(true);
	},
	_set_primary:function(p){
		var opened = this.options.opened, paneOpts, i;
		if( this._tk.initialized ){ //-- be sure to not let old primary in a closed state
			this.set('opened',true);
		}
		this.primary = this[p];
		this.secondary = this[p==='prev'?'next':'prev'];
		paneOpts = $.toolkit._readClassNameOpts(this.secondary,$.tk.splitpane._tk.baseClass+'-pane',this._classNameOptions);
		//-- don't override stored options
		if( paneOpts.opened && opened!==null){
			delete paneOpts.opened;
		}
		paneOpts.size = this.options.size?this.options.size:(paneOpts.size?paneOpts.size:0);
		this.options.primary = p;
		this.set(paneOpts);
		if(this._tk.initialized){ // restore opened state
			this.set('opened',opened);
		}
		this.__checkSize(true);
		return p;
	},
	_set_min:function(m){
		this.options.min = Math.max(0,parseInt(m,10));
		this.__checkSize(true);
		return this.options.min;
	},
	_set_max:function(m){
		this.options.max = Math.max(0,parseInt(m,10));
		this.__checkSize(true);
		return this.options.max;
	},

	_set_size:function(s){
		this.secondary[this.__sizeProp()](s);
		this.__resized();
	},
	_set_toggleSpeed:function(s){
		if(! $.support.boxModel ){
			return 0;
		}
		return typeof s==='number'?s:parseInt(s,10);
	},
	_set_opened:function(o){
		//- console.trace()
		if( typeof o !== 'boolean'){
			o = (o==='closed'||o==='false')?false:true;
		}
		var secondaryVisible = this.secondary.is(':visible');
		if( o === secondaryVisible ){
			return o;
		}
		var self=this
			//- , secondaryVisible = self.secondary.is(':visible')
			, opened = self.options.opened
			, sizeProperty = self.__sizeProp()
			, sizeVal = self.secondary[sizeProperty]()
			, outerSizeVal=self.secondary[self.__outerProp(sizeProperty)](true)
			, initialized = self._tk.initialized?self.elmt.parent('.tk-splitpane').splitpane('get1_pluginInstance')._tk.initialized:false;
			;
		//-- get instance of parent splitpane
		if( ! ( initialized && self.options.toggleSpeed > 0 ) ){//-- no anim at init time or quirks mode
			if( self.primary.is(':visible') ){ //- adjust primary
				self.primary[sizeProperty](self.primary[sizeProperty]()+(o?-outerSizeVal:outerSizeVal));
			}
			if( o ){
				self.secondary[sizeProperty](sizeVal).show(0);
				if( !$.support.boxModel){
					self.secondary.css('display','');
				}
			}else{
				self.secondary.hide(0)[sizeProperty](sizeVal);
			}
			self.__checkSize();
			self.__resized();
			return o;
		}

		if( self.primary.is(':visible') ){ //- adjust primary
			var pSizeVal = (o?"-":"+")+"="+outerSizeVal;
			pSizeVal = sizeProperty==='height'?{height:pSizeVal}:{width:pSizeVal};
			self.primary.animate(pSizeVal,self.options.toggleSpeed,self.options.toggleEasing);
		}
		if(o){ //-- show secondary
			self.secondary[sizeProperty](0).show().animate(
				sizeProperty==='height'?{height:sizeVal}:{width:sizeVal}
				, self.options.toggleSpeed
				, self.options.toggleEasing
				, function(){self.__resized();}
			);
		}else{ //-- hide secondary
			self.secondary.animate(
				sizeProperty==='height'?{height:0}:{width:0}
				, self.options.toggleSpeed
				, self.options.toggleEasing
				, function(){$(this).hide()[sizeProperty](sizeVal);self.__resized();}
			);
		}
		self.__checkSize();
		self.__resized();
		return o;
	},
	/** toggle callback */
	toggle:function(e){
		this.set('opened',!this.options.opened);
		return this;
	},
	/** dragging separators */
	startCapture:function(e){
		e.preventDefault();
		e.stopImmediatePropagation();
		if( ! this.secondary.is(':visible') ){
			return;
		}
		var self = this
			, posProp = self.__posProp()
			, sizeProp = self.__sizeProp()
			, outerProp = self.__outerProp(sizeProp)
			, posVal = self.options.orientation==='vertical'?e.pageY:e.pageX
			;
		self.capturePos.start = {top:e.pageY,left:e.pageX};
		//-- calc max and min
		self.capturePos.min[posProp] = posVal - self.prev[outerProp]();
		self.capturePos.max[posProp] = posVal + self.next[outerProp]();
		if( self.options.min){
			if( self.options.primary==='next'){
				self.capturePos.min[posProp] += self.options.min;
			}else{
				self.capturePos.max[posProp] -= self.options.min;
			}
		}
		if( self.options.max){
			if( self.options.primary==='next'){
				self.capturePos.max[posProp] = Math.min(self.capturePos.max[posProp],posVal - self.prev[outerProp]() +self.options.max);
			}else{
				self.capturePos.min[posProp] = Math.max(self.capturePos.min[posProp],posVal + self.next[outerProp]() -self.options.max);
			}
		}
		//-- init mousemove event
		$('body')
			.bind('mousemove.paneSplitter',function(e){ self.capture(e); return false;})
			.bind('mouseup.paneSplitter',function(e){ self.stopCapture(e); e.preventDefault();});
		return false;
	},
	capture:function(e){
		var self = this,delta=self.__get_capturePostitionDelta(e);
		if(! self.clone.is(':visible')){
			self.clone.show().css({
				width:self.elmt.width(),
				height:self.elmt.height(),
				top:-parseInt(self.clone.css('borderTopWidth'),10),
				left:-parseInt(self.clone.css('borderLeftWidth'),10)
			});
		}
		self.clone.css(self.__posProp(),delta);
	},
	stopCapture:function(e){
		$('body').unbind('.paneSplitter');
		var self = this,delta=self.__get_capturePostitionDelta(e),sizeProp=self.__sizeProp();
		if(! self.clone.is(':visible') ){
			return self.toggle(e);
		}
		self.clone.hide();
		// check action
		self.prev[sizeProp](self.prev[sizeProp]()+delta);
		self.next[sizeProp](self.next[sizeProp]()-delta);
		self.__checkSize();
		self.set('size',self.secondary[sizeProp]());
		//self.__resized();
	},

	/** internals */
	__resized:function(){
		this.primary.trigger('resize');
		this.secondary.trigger('resize');
	},
	__checkSize:function(triggerEvent){
		var self = this;
		if(! self._tk.initialized){
		//- if(! self.secondary){
			return;
		}
		//- if( self.secondary.is(':visible') ){
			var sizeProp = self.__sizeProp(),sizeVal=self.secondary[sizeProp](),resized=false;
			if( self.options.min && self.options.min > sizeVal ){
				self.secondary[sizeProp](self.options.min);
				self.primary[sizeProp](self.primary[sizeProp]()- (self.options.min - sizeVal));
				resized=true;
			}
			if( self.options.max && self.options.max < sizeVal ){
				self.secondary[sizeProp](self.options.max);
				self.primary[sizeProp](self.primary[sizeProp]()+ (sizeVal-self.options.max));
				resized=true;
			}
			if( resized && triggerEvent ){
				self.__resized();
			}
		//- }
	},
	__get_capturePostitionDelta:function(e){
		var posProp = this.__posProp();
		return Math.max(Math.min(posProp==='top'?e.pageY:e.pageX, this.capturePos.max[posProp]),this.capturePos.min[posProp]) - this.capturePos.start[posProp] ;
	},
	__sizeProp:function(){
		return this.options.orientation==='vertical'?'height':'width';
	},
	__posProp:function(){
		return this.options.orientation==='vertical'?'top':'left';
	},
	__outerProp:function(p){
		return "outer"+p.replace(/^./,function(m){return m.toUpperCase();});
	}

});
$.tk.paneSplitter.defaults = {
	primary:'next'
	, orientation:'vertical'
	, toggleEasing:'linear'
	, toggleSpeed:100 // put 0 for no anim (always 0 with quirks mode)
	, min:0
	, max:0
	, opened:null
	, size:0
};


$.toolkit('tk.splitpane',{
	_classNameOptions:{
		mainPane: '|\\d+',
		orientation: '|horizontal|vertical'
	},
	_init:function(){
		// create separators between childs div
		var self = this,h=0;
		self.elmt.textChildren().remove();
		self.panes = self.elmt.children('div').addClass(self._tk.baseClass+'-pane');
		//-- make separators
		self.panes.not(':last').after('<div class="'+$.tk.paneSplitter._tk.baseClass+'"></div>');
		self._applyOpts('orientation');
		self.separators = self.elmt.find(' > .'+$.tk.paneSplitter._tk.baseClass);
		//-- determining the mainPane
		if( self.options.mainPane===null || self.options.mainPane >= self.panes.length  || self.options.mainPane < 0){
			self.options.mainPane = self.panes.length-(self.separators.length>1?2:1);
		}
		self.mainPane = self.panes.filter(':eq('+self.options.mainPane+')');
		//-- instanciate splitters with correct options
		if( self.options.mainPane === (self.panes.length-1)){
			self.separators.paneSplitter({orientation:self.options.orientation});
		}else{
			var mainSplitter = self.mainPane.next('.'+$.tk.paneSplitter._tk.baseClass);
			self.separators.not(mainSplitter).paneSplitter({orientation:self.options.orientation});
			mainSplitter.paneSplitter({orientation:self.options.orientation,primary:'prev'});
		}
		//-- sizing elements
		self.elmt.bind('resize',function(){ self.__resize(); });
		self.__resize();
	},
	_set_mainPane:function(){
		throw('mainPane can only be set at initialisation time in this version');
	},
	_set_orientation:function(o){
		$.toolkit._removeClassExp(this.elmt,this._tk.baseClass+'-orientation-*',this._tk.baseClass+'-orientation-'+o);
		if( this.separators){
			this.separators.paneSplitter('set_orientation',o);
			this.options.orientation = o;
			this.__resize();
		}
	},
	__resize:function(){
		var self = this;
		if( self.options.orientation === 'vertical'){
			var h=self.elmt.height()-self.mainPane.outerHeight(true)+self.mainPane.height()
				, w=self.elmt.width();
			self.separators.each(function(){h-=$(this).width(w).outerHeight(true);});
			self.panes.each(function(){var e = $(this); e.width(w-e.outerWidth(true)+e.width())})
				.filter(':visible').not(self.mainPane).each(function(){h-=$(this).outerHeight(true);});
			self.mainPane.height(h);
		}else{
			var w=self.elmt.width()-self.mainPane.outerWidth(true)+self.mainPane.width()
				, h=self.elmt.height();
			self.separators.each(function(){w-=$(this).height(h).outerWidth(true)});
			self.panes.each(function(){var e = $(this); e.height(h-e.outerHeight(true)+e.height())})
				.filter(':visible').not(self.mainPane).each(function(){w-=$(this).outerWidth(true);});
			self.mainPane.width(w);
		}
	}
});
$.tk.splitpane.defaults = {
	mainPane:null,
	orientation:'vertical'
}

})(jQuery);
