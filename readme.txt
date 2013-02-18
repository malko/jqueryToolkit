# JqueryToolkit Basic documentation
### Creating a new plugin:

```javascript
$.toolkit('namespace.pluginName',{..protoype..});
```

creating your plugin with toolkit like describe above you know may instantiate
your plugin by doing:

```javascript
$('selector').pluginName({options});
```

access any plugin method that don't start with an _ doing

```javascript
$('selector').pluginName('methodName'[,arg1,arg2...,argn]);
```

if the method name start with 'get' then the method is considered as a getter
so the method returned values are return as an Array instead of a jQuery object. 
any element on which the plugin is applied will be ensured to have a className
namespace-pluginName applied on them if not already applied in the original markup.


properties of the plugin (used as options) may be accessed by

```javascript
$('selector').pluginName('get_optionName') // return an array of optionName for each elements in the set
$('selector').pluginName('get1_optionName') // return optionName value of the first elment in the matching set
```
### reading options directly from class element attribute.
jQueryToolkit plugins will most of the time allow you to set some options
directly inside the class attribute of the element.
For example let's imagine we have a plugin named "resizer" that set image width
and height attribute to 3 predefined size. It will have  a size option that can
take small|normal|big as values and a zoomHover options that can take values
true|false

if in our original markup we have this:
```
<img src="myimage.png" class="tk-resizer" />
```
we will instanciate the plugin like this
```javascript
$('.tk-resizer').resizer({size:'small',zoomHover:true});
```

If we've previously declared a property '_classNameOptions' in our plugin
prototype just like this:
```javascript
$.toolkit('tk.resizer',{
  _classNameOptions:{
    size:'small|normal|big',
    zoomHover:'|zoom', //-- starting our expression with a '|' make it optional
  },
  _init:function(){
    // initialize your plugin
    // this.elmt is the binded element
    // this.options contains options values
  }
  ... rest of the plugin prototype ...
});
```
now we can achieve the same as before doing this:
```html
<img src="myimage.png" class="tk-resizer-small-zoom" />
```
```javascript
$('.tk-resizer').resizer();
```
(this suppose our plugin to understand that zoom as a value for zoomHover has to
be considered as true)
