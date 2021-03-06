/**
new javascript widget toolkit based on jquery.
This work is largely inspired by jquery-ui and so you may wonder why another library ?
The answer is not good or bad, just that i like jquery-ui but sometimes i desire to make things differently
for example i like to drive most of enhancement just by giving classnames to my basic markup and that particular stuff
was rejected by the jquery-ui team. As another example many users claim for some additions in the base css-framework
like a ui-state-success or something like that but this was also rejected by the team. Other stuffs like thoose ones
was really missing to better stick to my way of doing things so i start this new library.
( Don't misandurstood me jquery-ui is great library and the base of Tk is largely taken from it. )

@author jonathan gotti <jgotti at jgotti dot net>
@licence Dual licensed under the MIT / GPL licenses.

@changelog
 - 2011-12-20 - make jQuery.fn.prop point to jQuery.fn.attr when not exists as a quick old jquery version compatibility fix
 - 2011-09-23 - add $.toolkit.mediaQuery for css media Queries detection
 - 2011-07-26 - $.toolkit.requestUniqueId window.top bug on FF if embeded in frame from external domain finally resolved
 - 2011-07-06 - $.toolkit.requestUniqueId bug that make return twice tkUID1 solved
 - 2011-06-15 - $.toolkit.requestUniqueId window.top bug if embeded in frame from external domain resolved
 - 2011-03-27 - _removeClassExp() now can work on jquery element set, tkSetState() now work with states groups and allow a second parameter dontOverride
 - 2011-03-23 - plugins._trigger() method now use window.event as a default event if none is passed
 - 2011-03-21 - add new plugin method _bind() to ease event binding
 - 2011-03-16 - add new toolkit methods: loadScript() and getScriptPath()
              - now initPlugins will try to autoload missing tk-plugins
 - 2011-02-14 - now initPlugins can take context as third arguments.
 - 2010-11-02 - add new selector :textnode and add textChildren method to jquery
 - 2010-11-01 - make _tk property an exposed property of constructor and make it more easy to extend
              - make a little change in _readClassNameOpts to allow usage of submasks and assertions in _classNameOptions expressions
 - 2010-10-xx - added optional second parameter nameSpace to $.toolkit.initPlugins (default to "tk" if not passed)
              - $.toolkit.initPlugins can now take 'all' as a parameter and it will try to init all preloaded plugins in the given nameSpace
   2010-08-31 - some more work on plugin inheritance (instanceof basePlugin will only be true if basePlugin is a toolkit.plugin (we want to create a toolkit.plugin! ))
 - 2010-07-26 - first attempt for pseudo plugin inheritance
 - 2010-07-22 - add tkSetState() method
 - 2010-07-13 - add support for user define initPlugin method ($.tk.[pluginName].initPlugin = function(){...})
 - 2010-07-08 - change disable method to consider true/false as intended (true => disable) and return this
 - 2010-04-04 - add disable jquery method
 - 2010-04-04 - rewrite _trigger
 - 2010-02-24 - add ensureId jquery method and rename uniqueId toolkit method to requestUniqueId as it's more meeningfull
							- make use of ensureId method at widet construction time.
							- $.toolkit._getInstance() now accept jQuery element as first parameter (in which case it will work on the first element of the collection)
 - 2010-02-16 - add get(1)_pluginInstance method
 - 2010-02-10 - add urlElementLevel to storableOptions
 - 2010-01-26 - add uniqueId method and use it for any element promoted to widget that haven't id already set

*/

(function($){

	var _dbg_ = true,
		_throwOnBadCall=true
	;
	if(! $.fn.prop){ //-- old jquery version compat for missing prop method
		$.fn.prop = $.fn.attr;
	}
	window.dbg = function(){
		if(! _dbg_ ){
			return false;
		}
		if( typeof console !=='undefined' && console.debug){
			if( typeof chrome !== 'undefined'){
				for( var i=0,l=arguments.length,args=[];i<l;i++){
					args[i]=arguments[i];
				}
				console.debug(args);
			}else{
				console.debug(dbg.caller,arguments);
			}
		}else if(typeof opera !== 'undefined' && typeof opera.postError !== 'undefined'){
			var s = []
			,i
			,_dbg=function(a){
				var i,s = [];
				if( a instanceof Array ){
					for( i=0;i<a.length;i++ ){ s.push( typeof(a[i])==='object' ? _dbg(a[i]) : a[i] ); }
					return '['+s.join(', ')+']';
				}else if( typeof(a)==='object'){
					for( i in a ){ s.push( i+':'+_dbg(a[i])); }
					return '{'+s.join(', ')+'}';
				}
				return a;
			};
			for( i=0; i< arguments.length;i++ ){s.push(_dbg(arguments[i]));}
			opera.postError(s.join(', '));
		}
	};

$.toolkit = function(pluginName,basePlugin,prototype){
	//-- make nameSpace optional default to tk.
	var nameSpace = 'tk';
	if( ! prototype ){
		prototype = basePlugin;
		basePlugin = $.toolkit.plugin;
	}else if( typeof basePlugin === 'string' ){
		if( basePlugin.indexOf('.') > 0){
			basePlugin = basePlugin.split('.');
			if( undefined === $[basePlugin[0]] || undefined === $[basePlugin[0]][basePlugin[1]] ){
				throw('jquery.toolkit '+pluginName+' trying to extend undefined plugin $.'+basePlugin[0]+'.'+basePlugin[1]);
	}
			basePlugin = $[basePlugin[0]][basePlugin[1]];
		}else{
			basePlugin = $[nameSpace][basePlugin];
		}
	}
	if( pluginName.indexOf('.')){
		pluginName = pluginName.split('.');
		nameSpace = pluginName[0];
		pluginName= pluginName[1];
	}
	//-- make plugin initializer and put it in the given namespace
	if( undefined===$[nameSpace]){
		$[nameSpace]={};
	}
	$[nameSpace][pluginName] = function(elmt,options) {
		if( arguments.length < 1){ //-- if no arguments we considering to be in situation of extending the plugin
			return;
		}
		var self = this;
		self._tk = $.extend({initialized:false},$[nameSpace][pluginName]._tk);
		self.elmt = $(elmt).ensureId();
		self.elmt.data(pluginName,self);
		//-- merge options
		var inlineOptions = self._classNameOptions?$.toolkit._readClassNameOpts(self.elmt,self._tk.baseClass,self._classNameOptions):{};
		self.elmt.addClass(self._tk.baseClass);
		self.options=$.extend(
			true,
			{},
			$[nameSpace][pluginName].defaults||{},
			inlineOptions,
			options||{}
		);

		if( self._storableOptions && (! self.options.disableStorage) && $.toolkit.storage && $.toolkit.storage.enable() ){
			if( self._storableOptions.pluginLevel ){
				var oV = '',pStored=self._storableOptions.pluginLevel.split(/[,\|]/);
				for(var i=0;i<pStored.length;i++ ){
					oV = $.toolkit.storage.get(self._tk.pluginName+'_'+pStored[i]);
					if( null !== oV){
						self.options[pStored[i]]=oV;
					}
				}
			}
			var id = self.elmt.prop('id'),
			v ='',eStored='',encodedUri=escape(window.location.href);
			if( id && self._storableOptions.elementLevel){
				eStored=self._storableOptions.elementLevel.split(/[,\|]/);
				for(var i=0;i<eStored.length;i++ ){
					v = $.toolkit.storage.get(self._tk.pluginName+'_'+eStored[i]+'_'+id);
					if( null !== v){
						self.options[eStored[i]]=v;
					}
				}
			}
			if( id && self._storableOptions.urlElementLevel){
				eStored=self._storableOptions.urlElementLevel.split(/[,\|]/);
				for(var i=0;i<eStored.length;i++ ){
					v = $.toolkit.storage.get(self._tk.pluginName+'_'+eStored[i]+'_'+id+'_'+encodedUri);
					if( null !== v){
						self.options[eStored[i]]=v;
					}
				}
			}
		}

		if( $.isFunction(self._init) ){
			self._init();
		}
		self._tk.initialized=true;
	};
	//-- extends plugin methods
	basePlugin = new basePlugin();
	if(! ( basePlugin	instanceof $.toolkit.plugin) ){
		basePlugin = $.extend(true,new $.toolkit.plugin(),basePlugin);
	}
	$[nameSpace][pluginName].prototype = basePlugin;
	$.extend(true,$[nameSpace][pluginName].prototype,prototype);
	/*$[nameSpace][pluginName].prototype = $.extend(
		true,{},
		new basePlugin(), //-- create a new class
		//- basePlugin?$.tk[basePlugin].prototype:$.toolkit.plugin.prototype, //-- create a new class
		//- $.toolkit.plugin.prototype, //-- extend it with base tk prototype
		prototype //-- finally add plugin own methods
	);*/
	//-- set and expose _tk values as constructor property
	$[nameSpace][pluginName]._tk=$.extend({
		nameSpace:nameSpace,
		pluginName:pluginName,
		baseClass:nameSpace+'-'+pluginName
	},prototype._tk||{});
	//-- expose plugin function to the world
	$.fn[pluginName] = function(){
		var method = null,propName=null,onlyOne=false,ret=false;
		if( typeof arguments[0] === "string"){
			method = Array.prototype.shift.call(arguments,1);
			if( method.match(/^_/)){ //-- avoid call to pseudo private methods
				return this;
			}
			ret = method.match(/^(get|return)/)?true:false;
			if(! $.isFunction($[nameSpace][pluginName].prototype[method]) ){
				var match = method.match(/^([sg]et|return)(1)?(?:_+(.*))?$/);
				if( null === match){
					if(typeof(_throwOnBadCall)!=='undefined' && _throwOnBadCall){
						throw('jquery.toolkit.plugin: '+method+'() unknown method call.');
					}
					return this;
				}
				propName = match[3]?match[3]:Array.prototype.shift.call(arguments,1);
				method   = ('return'===match[1])?propName:match[1];
				onlyOne  = match[2]?true:false;
			}
		}
		var args = arguments,
			res = [];
		//- var res = new Array;
		this.each(function(i){
			var instance = $.toolkit._getInstance(this, nameSpace+'.'+pluginName, method?true:(args[0]||{}));
			if( method && $.isFunction(instance[method]) ){
				switch(method){
					case 'get':
						res[i] = instance.get(propName);break;
					case 'set':
						if( propName ){
							instance.set(propName,args[0]);break;
						}
						// continue to default intentionnaly
					default:
						res[i] = instance[method].apply(instance,args);
				}
			}
		});
		return ret?(onlyOne?res[0]:res):this;
	};
};

/**
* Common toolkit plugins prototypes
*/
$.toolkit.plugin = function(){};
$.toolkit.plugin.prototype = {
	/* this is internal property of the plugin set a the instanciation time
	_tk:{
		nameSpace:null,
		pluginName:'tkplugin',
		baseClass:'tk-plugin',
		initialized:false
	},
	*/
	/*
	// optional options and their values that may be applyed by element's class attribute. (init options will overwrite them)
	_classNameOptions: {
		optName:'optValue1|optValue2|...optValueN'
	},
	_storableOptions:{ // if set options names given there will try to save their state using available $.toolkit.storage api if enable
		pluginLevel:'optName, ...',    // thoose ones will be stored for all plugin instance
		elementLevel:'optName, ...'    // thoose ones will be stored for each plugin instance depending on their element id attribute.
		urlElementLevel:'optName, ...' // thoose ones will be stored for each plugin instance depending on the url + element id .
	}
	*/
	elmt:null,
	options:{
		disableStorage:false
	},
	// played only once by elmt
	_init: function(){},
	// effectively apply settings by calling set on given options names.
	// additional parameter ifNotDefault will only apply settings if different from default.
	_applyOpts: function(names,ifNotDefault){
		var i;
		if( typeof names === 'string'){
			names = names.split(/[|,]/);
		}
		if(! ifNotDefault){
			for(i=0;i<names.length;i++){
				this.set(names[i],this.options[names[i]]);
			}
			return this;
		}
		var defaults = $[this._tk.nameSpace][this._tk.pluginName].defaults;
		for(i=0;i<names.length;i++){
			if( defaults[names[i]] !== this.options[names[i]] ){
				this.set(names[i],this.options[names[i]]);
			}
		}
		return this;
	},
	//-- event management --//
	_bind:function(eventName,callback){
		this.elmt.bind(eventName.replace(/(\s+|$)/g,'.'+this._tk.pluginName+'$1'),callback);
		return this;
	},
	_trigger: function(eventName, originalEvent, params){
		if( undefined===params){
			params = [this.elmt];
		}
		switch( eventName.indexOf('_')){
			case -1:
				eventName = this._tk.pluginName+'_'+eventName;break;
			case 0:
				eventName = eventName.substr(1);break;
			default://do nothing
		}
		/*
		next 7 lines from jquery-ui
		copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
		Dual licensed under the MIT (MIT-LICENSE.txt)
		and GPL (GPL-LICENSE.txt) licenses.
		copy original event properties over to the new event
		this would happen if we could call $.event.fix instead of $.Event
		but we don't have a way to force an event to be fixed multiple times*/
		var e = $.Event(originalEvent||window.event); //-- toolkit add window.event as a default originalEvent
		if ( e.originalEvent ) {
			for ( var i = $.event.props.length, prop; i; ) {
				prop = $.event.props[ --i ];
				e[ prop ] = e.originalEvent[ prop ];
			}
		}
		//var e = $.event.fix(originalEvent||{});
		e.type = eventName;
		//return this.elmt.triggerHandler(e,params);
		this.elmt.trigger(e,params);
		return e.isDefaultPrevented()?false:true;
	},
	_get_pluginInstance:function(){
		return this;
	},
	//-- Exposed methods --//
	get:function(key){
		if( $.isFunction(this['_get_'+key])){
			return this['_get_'+key]();
		}
		return ( typeof this.options[key] !== 'undefined')?this.options[key]:undefined;
	},
	set:function(key,value){
		if( typeof key === 'object'){
			var k='';
			for( k in key){
				this.set(k,key[k]);
			}
			return this;
		}
		if( $.isFunction(this['_set_'+key]) ){
			var v = this['_set_'+key](value);
			if( undefined !== v){
				value = v;
			}
		}
		if( typeof this.options[key] !== 'undefined'){
			this.options[key] = value;
		}
		if( this._storableOptions && (! this.options.disableStorage) && $.toolkit.storage && $.toolkit.storage.enable() ){
			var exp = new RegExp('(^|,|\\|)'+key+'($|,|\\|)');
			if( this._storableOptions.pluginLevel && this._storableOptions.pluginLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key,value);
			}else if( this._storableOptions.elementLevel && this._storableOptions.elementLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key+'_'+this.elmt.prop('id'),value);
			}else if( this._storableOptions.urlElementLevel && this._storableOptions.urlElementLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key+'_'+this.elmt.prop('id')+'_'+escape(window.location.href),value);
			}
		}
		return this;
	}
};

//-- TOOLKIT HELPER METHODS --//
/**
* initialise plugins of pluginName for the given nameSpace and context.
* So all elements in the dom that have a class nameSpace-pluginName will be initialized.
* if nameSpace is tk and pluginName isn't loaded then it will try to load it dynamicly before initialization.
* @param string pluginNames may be a single plugin name or a list of pluginNames separated by |
*                           if 'all' or empty string '' is passed then will try to init all plugins
*                           found in the given nameSpace
* @param string nameSpace   the plugin nameSpace to initialize default to 'tk' if empty
* @param jQueryContext context the context to limit the initialization on (default to the entire document)
* @return void
*/
$.toolkit.initPlugins = function(pluginNames,nameSpace,context){
	if(! nameSpace){
		nameSpace = 'tk';
		if( ! $.tk ){ $.tk={}; }
	}
	if( pluginNames === '' || undefined === pluginNames){
		pluginNames = 'all';
	}
	if(typeof pluginNames === 'string'){
		if( pluginNames !=='all'){
			pluginNames = pluginNames.split(/[|,]/);
		}else{ //-- try to init all loaded plugins
			pluginNames = [];
			for( var i in $[nameSpace]){
				pluginNames.push(i);
			}
		}
	}
	var p,pUri;
	for( var i=0,l=pluginNames.length,p='';i<l;i++){
		p=pluginNames[i];
		if( nameSpace ==='tk' && ! $[nameSpace][p] ){ // try to auto load tk plugins
			pUri = $.toolkit.getScriptPath('jquery\\.toolkit(-[\\d\.-]+)?(\\.min)?\\.js');
			if(pUri===false){
				continue;
			}else{
				pUri += "plugins/"+p+"/jquery.tk."+p+".js";
				//-- try to load css if exists
				$.toolkit.loadScript(pUri.replace(/\.js$/,'.css'));
				$.toolkit.loadScript(pUri,function(){
					if( $.tk[p] && $.isFunction($.tk[p].initPlugin)){
						$.tk[p].initPlugin(context);
					}else{
						new Function("c","jQuery('.tk-"+p+"',c)."+p+"()")(context);
					}
				},'$.tk.'+p);
				continue;
			}
		}
		if( $[nameSpace] && $[nameSpace][p] && $.isFunction($[nameSpace][p].initPlugin)){
			$[nameSpace][p].initPlugin(context);
		}else if( $.isFunction($.fn[p]) ){
			new Function("c","jQuery('."+nameSpace+"-"+p+"',c)."+p+"()")(context);
		}
	}
};

$.toolkit.getScriptPath=function(scriptName){
	if( typeof $.toolkit.__scriptPaths ==="undefined"){
		$.toolkit.__scriptPaths = {};
	}else if(typeof $.toolkit.__scriptPaths[scriptName] !== undefined){
		return $.toolkit.__scriptPaths[scriptName];
	}
	var type = scriptName.match(/\.css$/)?'link[type=text/css]':'script[src]'
		, scripts = $(type)
		, scriptExp = new RegExp(scriptName+'$')
	;
	$.toolkit.__scriptPaths[scriptName] = false;
	scripts.each(function(){
		if( this.src.match(scriptExp) ){
			$.toolkit.__scriptPaths[scriptName] = this.src.replace(scriptExp,'');
			return false; //break;
		}
	});
	return $.toolkit.__scriptPaths[scriptName];
};
$.toolkit.loadScript = function(uri,callback,waitFor){
	if( uri instanceof Array ){
		for(var i=0,l=uri.length;i<l;i++){
			$.toolkit.loadScript.apply(this,uri);
		}
		return;
	}
	if( callback instanceof Array){
		var callbacks = callback;
		callback = function(){
			$.toolkit.loadScript.apply(null,callbacks);
		};
	}
	if(eval("typeof " + waitFor) !== 'undefined' && callback){
		return callback();
	}
	var parent = document[document.head?'head':'body']
		, elmt = uri.match(/\.css$/)?'link':'script'
		, type = 'text/'+(elmt==="link"?'css':'javascript')
	;
	if( elmt==='link'){
		elmt = document.createElement(elmt);
		elmt.rel = 'stylesheet';
		elmt.href=uri;
	}else{
		elmt = document.createElement(elmt);
		elmt.src=uri;
	}
	if( callback ){
		if( waitFor ){
			var interval = setInterval(function(){
				if(eval("typeof " + waitFor) !== 'undefined'){
					clearInterval(interval);
					callback();
				}
			},50);
		}else{
			if( s.onreadystatechange===null ){
				s.onreadystatechange = function(){
					if( s.readyState === 'complete' || s.readyState === 'loaded' )
						s.onreadystatechange=null;
						callback();
				};
			}else{
				s.onload=callback;
			}
		}
	}
	parent.appendChild(elmt);
	return;
};
/**
* allow to be sure to get a plugin instance from plugin instance or element on which the plugin is applyied.
* @param object  elmt         the pluginInstance or the element we want the plugin instance of
* @param string  pluginName   the plugin full name with namespace (namespace.pluginname) namespace will default to tk if not passed.
* @param mixed   defaultToNew if passed as true will ensure to return a plugin instance even on element with no plugin already attached.
*                             if passed as object will be considered as options for new instance creation (only if no attached instance is found)
* return pluginInstance or undefined
*/
$.toolkit._getInstance = function(elmt,pluginName,defaultToNew){
	var nameSpace = 'tk';
	if( pluginName.indexOf('.') > -1){
		pluginName = pluginName.split('.');
		nameSpace = pluginName[0];
		pluginName= pluginName[1];
	}
	if( elmt instanceof $[nameSpace][pluginName]){
		return elmt;
	}
	if( elmt instanceof jQuery){
		elmt = elmt.get(0);
	}
	var instance = $.data(elmt,pluginName);
	if( instance ){
		//dbg('living '+pluginName+' Instance found for',elmt,instance);
		return instance;
	}else if(defaultToNew){
		//dbg('living '+pluginName+' Instance NOT found for',elmt,instance);
		return new $[nameSpace][pluginName](elmt,typeof(defaultToNew)==='object'?defaultToNew:undefined);
	}
	return undefined;
};

/**
* read extra options settings in widget.element's class attribute and return them as object
* @param domElement elmt        the dom or jquery element on which to look class attribute.
* @param string     baseClass   is the plugin baseClass we search for extended version
*                               (ie: baseClass tk-pluginName will look for any tk-pluginName-* class attribute),
* @param array      optionsList an associtive list of optionNames with their possible values separated by a pipe '|'
*                               if an empty value is set at first position it'll be considered optional.
* @return object
*/
$.toolkit._readClassNameOpts=function(elmt,baseClass,optionsList){
	elmt=$(elmt);
	//-- get class attribute if none then return
	var classAttr = elmt.attr('class');
	if( undefined===classAttr || classAttr.length <1){ // nothing to read return
		return {};
	}
	//prepare expression
	var opts={}, optName='', id=0, exp = '(?:^|\\s)'+baseClass+'(?=-)',noCaptureExp = /(^|[^\\])\((?!\?)/g, oVals;
	for(optName in optionsList ){
		oVals = optionsList[optName].replace(noCaptureExp,'$1(?:');//-- avoid capture parentheses inside expression
		exp += ( oVals.substr(0,1)==='|' )?'(?:-('+oVals.substr(1)+'))?':'-('+oVals+')';
	}
	exp = new RegExp(exp+'(?:$|\\s)');
	var matches = classAttr.match(exp);
	if( null===matches){
		return opts;
	}
	//prepare options objects from matches
	for(optName in optionsList){
		if( matches[++id]){
			opts[optName] = matches[id];
		}
	}
	return opts;
};

/**
* remove matching class names from element and eventually add new class on given element (default to widget.element)
* @param domElement     elmt element on which to work
* @param pseudoRegexp  exp  pseudo expression to search and remove any '*' will be evaluated as alphanum chars, - or _
* @param string        className to also add to the element after removing (shortcut to call $(elmt).addClass() )
* @return jqueryObject
*/
$.toolkit._removeClassExp = function(elmt,exp,add){
	elmt=$(elmt);
	if( elmt.length > 1){
		return elmt.each(function(){$.toolkit._removeClassExp(this,exp,add);});
	}
	var classAttr = elmt.attr('class');
	if( classAttr ){
		exp = new RegExp('(?:^|\\s)'+exp.replace(/\*/g,'[a-zA-Z_0-9_-]*')+'(?=$|\\s)','g');
		elmt.attr('class',classAttr.replace(exp,''));
	}
	if( undefined!==add ){
		elmt.addClass(add);
	}
	return elmt;
};

/**
* return a unique id for element
*/
$.toolkit.requestUniqueId = function(){
	var tk;
	try{
		tk = ( window.top.jQuery && window.top.jQuery.toolkit )? window.top.jQuery.toolkit : $.toolkit;
	}catch(e){
		tk = $.toolkit;
	}
	return 'tkUID'+ (( tk._uniqueId && ++tk._uniqueId ) || (tk._uniqueId = 1));
};

/**
* allow to test css media queries
* exemples: $.toolkit.mediaQuery('screen') or $.toolkit.mediaQuery('screen and (orientation:landscape)')
* @param string query the query you want to test
* @param bool   noCache if true then won't use cached results
* @return bool
*/
$.toolkit.mediaQuery = function(query,noCache){
	if(! $.toolkit.mediaQuery.cache){
		$.toolkit.mediaQuery.cache = {};
	}
	if( query in $.toolkit.mediaQuery.cache && ! noCache )
		return $.toolkit.mediaQuery.cache[query];

	var test = $('<div><style type="text/css">@media '+query+'{#tkMediaQueryTest{position:absolute;} }</style><div id="tkMediaQueryTest"></div></div>');
	$.toolkit.mediaQuery.cache[query] =  (test.appendTo('body').find('#tkMediaQueryTest').css('position')==='absolute' ?true:false);
	test.remove();
	return $.toolkit.mediaQuery.cache[query];
};

//-- some jquery methods extensions
$.extend($.fn,{
	ensureId:function(){
		return this.each(function(){
			var e = $(this)
				, id = e.prop('id');
			if( undefined === id){
				return ;
			}
			if( typeof id !== 'object' && id.length < 1 ){
				e.prop('id',$.toolkit.requestUniqueId());
			}
		});
	},
	disable:function(state){
		state = state===undefined?true:(state?true:false);
		this.prop("disabled",state?true:false)
		.attr("aria-disabled",state?"disabled":false)
		.toggleClass("tk-state-disabled",state);
		return this;
	},
	tkSetState:function(state,dontOverride){
		var stateGroups = ['normal|info|error|success|warning','disabled|active|focus|hover'],i,l;
		for(i=0,l=stateGroups.length;i<l;i++){
			if( stateGroups[i].match(state) ){
				if( dontOverride && this.attr('class').match(new RegExp('(?:^|\\s)tk-state-('+stateGroups[i]+')(?=$|\\s)')))
					return this;
				return $.toolkit._removeClassExp(this,'tk-state-('+stateGroups[i]+')','tk-state-'+state);
			}
		}
		if( dontOverride && this.attr('class').match(/(?:^|\s)tk-state-[a-zA-Z_0-9_-]+(?=$|\s)/))
			return this;
		return $.toolkit._removeClassExp(this,'tk-state-(?!'+stateGroups.join('|')+')*','tk-state-'+state);
	},
	textChildren: function(){
		var res = [],childs=this.prop('childNodes'),i,l;
		for( i=0,l=childs.length;i<l;i++){
			if( childs[i].nodeType===3 ){
				res.push(childs[i]);
			}
		}
		return $(res);
	}
});

//-- jquery selectors extensions
$.extend($.expr[':'],{
	textnode: function(a) {
		return a.nodeType==3?true:false ;
	}
});

//-- ensure bgiframe function if not already included --//
/* Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net)
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
* Version 2.1.1
*/
if(! $.fn.bgiframe ){
	$.fn.bgiframe = function(s) {
		// This is only for IE6
		if ( $.browser.msie && /6.0/.test(navigator.userAgent) ) {
			s = $.extend({
				top:'auto', // auto == .currentStyle.borderTopWidth
				left:'auto', // auto == .currentStyle.borderLeftWidth
				width:'auto', // auto == offsetWidth
				height:'auto', // auto == offsetHeight
				opacity:true,
				src:'javascript:false;'
			}, s || {});
			var prop = function(n){return n&&n.constructor==Number?n+'px':n;},
					html = '<iframe class="bgiframe"frameborder="0"tabindex="-1"src="'+s.src+'"'+
										 'style="display:block;position:absolute;z-index:-1;'+
											 (s.opacity !== false?'filter:Alpha(Opacity=\'0\');':'')+
									 'top:'+(s.top=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')':prop(s.top))+';'+
									 'left:'+(s.left=='auto'?'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')':prop(s.left))+';'+
									 'width:'+(s.width=='auto'?'expression(this.parentNode.offsetWidth+\'px\')':prop(s.width))+';'+
									 'height:'+(s.height=='auto'?'expression(this.parentNode.offsetHeight+\'px\')':prop(s.height))+';'+
						'"/>';
			return this.each(function() {
				if ( $('> iframe.bgiframe', this).length == 0 )
					this.insertBefore( document.createElement(html), this.firstChild );
			});
		}
		return this;
	};
}

})(jQuery);
