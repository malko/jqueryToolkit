/**
this plugin bind given element as toggler to activate/deactivate the display of the mouse coordinates in the pages with some rulers
it also can display a measurable area by holding down mouse button while moving.
@author jonathan gotti <jgotti at jgotti dot net>
@licence Dual licensed under the MIT / GPL licenses.
@since 2010-11
@changelog
 - 2010-11-08 - add zIndex management
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
			self.top = $('<div class="tk-measure-vertical"/>');
			self.right = $('<div class="tk-measure-horizontal"/>');
			self.bottom = $('<div class="tk-measure-vertical"/>');
			self.left = $('<div class="tk-measure-horizontal"/>');
			self.square = $('<div class="tk-measure-square"/>').appendTo('body').css('zIndex',zIndex);
			self.display = $('<div class="tk-measure-display tk-corner tk-content"/>');
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
			$(window).bind('mousemove.measure',function(e){self.move(e);});
			$(window).bind('keyup.measure',function(e){if( e.which===27) self.stop();})
			$(window).bind('mousedown.measure',function(e){self.squareStart(e);e.preventDefault();return false;});
			self.move(e);
			self.active=true;
		},
		stop:function(e){
			$(window).unbind('.measure');
			this.all.hide();
			this.square.hide();
			this.active=false;
		},

		squareStart:function(e){
			var self = this;
			$(window).one('mouseup.measure',function(e){self.squareEnd(e);});
			self.squareStartPos=[e.pageX,e.pageY];
			self.square.css({height:0,width:0,top:e.pageY,left:e.pageX}).show();
			$('body').addClass('tk-unselectable');
		},
		squareEnd:function(e){
			var self = this;
			self.square.hide();
			$('body').removeClass('tk-unselectable');
		},

		move:function(e){
			var self = this
				, doc=$(document)
				, w=$(window)
				, space=self.options.space
				//- , msg='<u>x:</u> '+e.pageX+' <u>y:</u> '+e.pageY
				, msg='<u>position:</u> '+e.pageX+'&times;'+e.pageY
				, pageX = e.pageX+space
				, pageY = e.pageY+space
				;
			//-- calc positions
			self.top.css({
				left:e.pageX,
				height:e.pageY-space
			});
			self.right.css({
				top:e.pageY,
				left:pageX,
				width:doc.width()-pageX
			});
			self.bottom.css({
				left:e.pageX,
				top:pageY,
				height:doc.height()-pageY
			});
			self.left.css({
				top:e.pageY,
				width:e.pageX-space
			});

			if( self.square.is(':visible')){
				var squareW = self.squareStartPos[0] - e.pageX, squareH = self.squareStartPos[1] - e.pageY;
				self.square.css({
					top:   Math.min(e.pageY, self.squareStartPos[1]),
					left:  Math.min(e.pageX, self.squareStartPos[0]),
					width: Math.max(squareW,0-squareW)-1,
					height:Math.max(squareH,0-squareH)-1
				});
				msg += '\n    <u>size:</u> '+self.square.outerWidth()+'&times;'+self.square.outerHeight();
			}
			self.display.html(msg).css({
				top:(w.scrollTop()+w.height()<pageY+self.display.outerHeight()+space)?e.pageY-self.display.outerHeight()-space:pageY,
				left:(w.scrollLeft()+w.width()<pageX+self.display.outerWidth()+space)?e.pageX-self.display.outerWidth()-space:pageX
			});

		}
	});
	$.tk.measure.defaults={
		space:10
	};

})(jQuery);