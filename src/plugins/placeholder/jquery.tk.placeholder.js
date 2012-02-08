(function($){

var placeholderNativeSupportInput = document.createElement('input')
	 , placeholderNativeSupport = ('placeholder' in placeholderNativeSupportInput) ? true:false
;
placeholderNativeSupportInput=undefined;

$.toolkit('tk.placeholder',{
	_init:function(){
		var self = this;
		self._applyOpts('text');
		if(! placeholderNativeSupport){
			self._bind('focus',function(){
				var val = self.elmt.val();
				if( val === self.options.text ){
					self.elmt.val('');
				}
			});
			self._bind('blur',function(){
				var val = self.elmt.val();
				if( val === '' ){
					self.elmt.val(self.options.text);
				}
			});
		}
	}
	,_set_text:function(t){
		if( ! t){ // check for placeholder attr as default
			t = this.elmt.attr('placeholder') || '';
			if(! t){ // check for related label value as default
				var id = this.elmt.attr('id')
					, label = id ? $('label[for="'+this.elmt.attr('id')+'"]') : this.elmt.parents('label')
				if( id && label.length){
					t = label.text();
				}
			}
		}
		if(! placeholderNativeSupport ){
			this.elmt.val(t);
		}
		this.elmt.attr('placeholder',t);
		return t;
	}
});


$.tk.placeholder.defaults= {
	'text':null
};

$.tk.placeholder.initPlugin = function(){
	if( placeholderNativeSupport){
		return;
	}
	$('[placeholder]').placeholder();
};
})(jQuery);