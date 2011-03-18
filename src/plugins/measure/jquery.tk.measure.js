/**
this plugin bind given element as toggler to activate/deactivate the display of the mouse coordinates in the pages with some rulers
it also can display a measurable area by holding down mouse button while moving.
@author jonathan gotti <jgotti at jgotti dot net>
@licence Dual licensed under the MIT / GPL licenses.
@since 2010-11
@changelog
 - 2011-03-16 - make use of plugin named class instead of static ones
 - 2011-03-14 - remove errors on undefined event
 - 2010-11-08 - add zIndex management
              - correct bugs on ie
              - add squareClass and squareOpacity options
*/
(function($){

	$.toolkit('tk.measure',{
		top:null,
		right:null,
		bottom:null,
		left:null,
		display:null,

		square:null,
		squareStartPos:[0,0],

		active:false,

		_init:function(){
			var self = this,zIndex=0;
			//-- check for highest z-index value
			$('*').each(function(){
				zIndex=Math.max(zIndex,parseInt($(this).css('zIndex'),10)||0);
			});
			zIndex+=1;
			//-- create elements needed for measure
			self.top = $('<div class="'+self._tk.baseClass+'-vertical"/>');
			self.right = $('<div class="'+self._tk.baseClass+'-horizontal"/>');
			self.bottom = $('<div class="'+self._tk.baseClass+'-vertical"/>');
			self.left = $('<div class="'+self._tk.baseClass+'-horizontal"/>');
			self.square = $('<div class="'+self._tk.baseClass+'-square"/>').appendTo('body').css('zIndex',zIndex);
			self.display = $('<div class="'+self._tk.baseClass+'-display tk-corner tk-content"/>');
			self.all = $([self.top[0],self.right[0],self.bottom[0],self.left[0],self.display[0]]).appendTo('body').css('zIndex',zIndex);
			self.elmt.bind('mousedown.measure',function(e){self.toggle(e);return false;});
		},
		toggle:function(e){
			this[this.active?'stop':'start'](e);
		},
		start:function(e){
			var self = this;
			self.all.show();
			self.square.hide();
			$('body').bind('mousemove.measure',function(e){self.move(e);return false;});
			$('body').bind('keydown.measure',function(e){if( e.which===27) self.stop();})
			$('body').bind('mousedown.measure',function(e){self.squareStart(e);e.preventDefault();return false;});
			self.move(e);
			self.active=true;
		},
		stop:function(e){
			$('body').unbind('.measure');
			this.all.hide();
			this.square.hide();
			this.active=false;
		},

		squareStart:function(e){
			var self = this, pageX = e?e.pageX:0, pageY=e?e.pageY:0;
			$('body').one('mouseup.measure',function(e){self.squareEnd(e);});
			self.squareStartPos=[pageX,pageY];
			self.square.css({height:0,width:0,top:pageY,left:pageX,opacity:self.options.squareOpacity}).addClass(self.options.squareClass).show();
			$('body').addClass('tk-unselectable');
		},
		squareEnd:function(e){
			var self = this;
			self.square.hide();
			$('body').removeClass('tk-unselectable');
		},

		move:function(e){
			var self = this
				//, doc=$(document)
				, w=$(window)
				, space=self.options.space
				//- , msg='<u>x:</u> '+e.pageX+' <u>y:</u> '+e.pageY
				, x = (e?e.pageX:0)
				, y = (e?e.pageY:0)
				, msg='<u>position:</u> '+x+'&times;'+y
				, pageX = x+space
				, pageY = y+space
				;
			//-- calc positions
			self.top.css({
				left:x,
				height:y-space
			});
			self.right.css({
				top:y,
				left:pageX,
				width:w.width()-pageX
			});
			self.bottom.css({
				left:x,
				top:pageY,
				height:w.height()-pageY
			});
			self.left.css({
				top:y,
				width:x-space
			});

			if( self.square.is(':visible')){
				var squareW = self.squareStartPos[0] - x, squareH = self.squareStartPos[1] - y, delta=$.support.boxModel?1:-1;
				self.square.css({
					top:   Math.min(y, self.squareStartPos[1]),
					left:  Math.min(x, self.squareStartPos[0]),
					width: Math.max(squareW,0-squareW)-delta,
					height:Math.max(squareH,0-squareH)-delta
				});
				msg += '<br />    <u>size:</u> '+self.square.outerWidth()+'&times;'+self.square.outerHeight();
			}
			self.display.html(msg).css({
				top:(w.scrollTop()+w.height()<pageY+self.display.outerHeight()+space)?y-self.display.outerHeight()-space:pageY,
				left:(w.scrollLeft()+w.width()<pageX+self.display.outerWidth()+space)?x-self.display.outerWidth()-space:pageX
			});

		}
	});
	$.tk.measure.defaults={
		space:10,
		squareOpacity:.7,
		squareClass:'tk-state-normal'

	};

})(jQuery);