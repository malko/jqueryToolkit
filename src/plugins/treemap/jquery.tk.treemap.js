(function($){
/**
@author jonathan gotti <jgotti at jgotti dot net>
@licence mainly Dual licensed under the MIT / GPL licenses.
Part of the code of this plugin is adapted from d3.js project to work as part of this tk plugin
(methods:divideArea,scale,worst,position) and is covered by following licence:
Copyright (c) 2010, Michael Bostock
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
* The name Michael Bostock may not be used to endorse or promote products
  derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Some other contributors of the original code : Squarified Treemaps by Mark Bruls, Kees Huizing, and Jarke J. van Wijk, Modified to support a target aspect ratio by Jeff Heer
*/

	// -> start of d3.js code adaptation (be aware this point to the plugin instance most of the time)
	var goldenNumber = 0.5 * (1 + Math.sqrt(5))
		,divideArea = function(nodes){
			if(nodes && nodes.length) {
				var row = []
					, rect = $.extend({},nodes.rect)
					, remaining = nodes.slice() // copy-on-write
					, node
					, best = Infinity // the best row score so far
					, score // the current row score
					, minSize = Math.min(rect.width, rect.height) // initial orientation
					, l
					, i
				;
				scale.call(this,remaining, rect.width * rect.height / (nodes.sum || this._sum(nodes)));
				row.area = 0;
				while ((l = remaining.length) > 0) {
					row.push( node = remaining[l-1]);
					row.area += node._tmarea;
					if ((score = worst(row, minSize)) <= best) { // continue with this orientation
						remaining.pop();
						best = score;
					} else { // abort, and try a different orientation
						row.area -= row.pop()._tmarea;
						position(row, minSize, rect, false);
						minSize = Math.min(rect.width, rect.height);
						row.length = row.area = 0;
						best = Infinity;
					}
				}
				if (row.length) {
					position(row, minSize, rect, true);
					row.length = row.area = 0;
				}
			}
			for(i=0,l=nodes.length; i<l; i++){
				if( nodes[i]._tmarea>0)this.drawNode(nodes[i]);
			}
		}
		// Compute the area for each child based on value & scale.
		,scale = function scale(nodes, scaleFactor){
			for( var i=0, l=nodes.length, area; i<l; i++ ){
				area = this._getNodeValue(nodes[i]) * (scaleFactor<0 ? 0 : scaleFactor);
				nodes[i]._tmarea = isNaN(area) || (area<=0 ? 0 : area);
			}
		}
		// Computes the score for the specified row, as the worst aspect ratio.
		,worst = function(row, minSize) {
			var area = row.area
				, max = 0
				, min = Infinity
			;
			for( var i=0, l=row.length; i<l; i++){
				if(! row[i]._tmarea ){
					continue;
				}
				min = Math.min(min,row[i]._tmarea);
				max = Math.max(max,row[i]._tmarea);
			}
			area *= area;
			minSize *= minSize;
			return area
					? Math.max((minSize*max*goldenNumber)/area, area/(minSize*min*goldenNumber))
					: 0;
		}
		// Positions the specified row of nodes. Modifies `rect`.
		,position = function(row, sideSize, rect, flush) {
			var left = rect.left
				, top = rect.top
				, side2Size = sideSize ? Math.round(row.area / sideSize) : 0
				, node
			;
			if( sideSize === rect.width){ // horizontal subdivision
				if (flush || side2Size > rect.height) side2Size = side2Size ? rect.height : 0; // over+underflow
				for( var i=0, l=row.length; i<l; i++ ){
					node = row[i];
					node._tmrect = {
						left:   left
						,top:   top
						,height:side2Size
						,width: side2Size ? Math.round(node._tmarea/side2Size) : 0
					};
					left += node._tmrect.width;
				}
				// node.z = true;
				node._tmrect.width += rect.left + rect.width - left; // rounding error
				rect.top += side2Size;
				rect.height -= side2Size;
			} else { // vertical subdivision
				if (flush || side2Size > rect.width) side2Size = side2Size ? rect.width : 0; // over+underflow
				for( var i=0, l=row.length; i<l; i++ ){
					node = row[i];
					node._tmrect = {
						left:   left
						,top:   top
						,width:side2Size
						,height: side2Size ? Math.round(node._tmarea/side2Size) : 0
					};
					top += node._tmrect.height;
				}
				// node.z = false;
				node._tmrect.height += rect.top + rect.height - top; // rounding error
				rect.left += side2Size;
				rect.width -= side2Size;
			}
		}
		// <- end of d3.js code adaptation
	;

	$.toolkit('tk.treemap',{
		rect:{
			top:0
			,left:0
			,width:0
			,height:0
		}
		,nodes:[]
		,_init:function(){
			// ensure parent element to be a position reference
			this.elmt.css('position')=='static' && this.elmt.css('position','relative');
			this.resetRect();
			this._applyOpts('sort|datas');
			this.squarify();
		}
		,_getNodeValue:function(node){
			switch(typeof this.options.value){
				case 'string':
					return parseFloat(node[this.options.value],10);
				case 'function':
					return parseFloat(this.options.value.call(node),10);
				default:
					throw "tk.treemap: invalid value property accessor";
			}
		}
		,_getNodeLabel:function(node){
			switch(typeof this.options.label){
				case 'string':
					return node[this.options.label];
				case 'function':
					return this.options.label.call(node);
				default:
					throw "tk.treemap: invalid label property accessor";
			}
		}
		,_sum:function(nodes){
			if( undefined===nodes){
				this.nodes.sum =  this._sum(this.nodes);
				return this.nodes.sum;
			}
			var tot = 0;
			for(var i=0,l=nodes.length;i<l;i++){
				tot += this._getNodeValue(nodes[i]);
			}
			nodes.sum = tot;
			return tot;
		}
		,_set_value:function(v){
			this.options.value = v;
			this._sum();
			if( this._tk.initialized ){
				this.nodes.sort(this.options.sort);
				this.squarify();
			}
			return v;
		}
		,_set_sort:function(sort){
			if( ! sort ){
				sort = (function(instance){
					return function(a,b){ return instance._getNodeValue(a)-instance._getNodeValue(b)}
				})(this);
			}
			if( this._tk.initialized ){
				this.nodes.sort(this.options.sort);
				this.squarify();
			}
			return sort;
		}
		,_set_datas:function(datas){
			this.nodes = $.extend([],datas).sort(this.options.sort);
			this.nodes.rect = this.rect;
			this._sum(this.nodes)
			if( this._tk.initialized ){
				this.nodes.sort(this.options.sort);
				this.squarify();
			}
		}
		,resetRect:function(){
			this.rect={
				top:0//this.elmt.css('paddingTop')
				,left:0//this.elmt.css('paddingLeft')
				,width:this.elmt.innerWidth()
				,height:this.elmt.innerHeight()
			}
			this.nodes.rect = this.rect;
			if( this._tk.initialized ){
				this.nodes.sort(sort);
			}
		}
		,squarify:function(nodes){
			if( ! nodes ){ nodes = this.nodes; }
			if(! nodes.rect ){ nodes.rect = this.rect; }
			if(! nodes.sum ){ this._sum(nodes); }
			divideArea(nodes);
			//console.debug('nodes',nodes);
		}
	});

	$.tk.treemap.defaults = {
		datas:[]
		,value:'value' // property accessor may be a property name or a function that return the value from node ie: function(){return this.value}
		,label:'label' // property accessor may be a property name or a function that return the label from node ie: function(){return this.label} (may return html too)
		,animDuration:750
		,animEasing:'swing'
		,sort:null // default to use the value accessor for sorting
		,drawNode:null // may be a callback function called at draw time, will receive actual jquery node element as this and nodeDatas as first parameter. (will be called between labeling and positionning the cell)
	}
})(jQuery);


/*
		,_divideArea:function(nodes){
			//console.debug('divide',nodes,nodes.rect);
			if( nodes.length === 1){
				nodes[0]._tmrect = nodes.rect;
				return this.drawNode(nodes[0]);
				return;
			}else if(! nodes.length ){
				return;
			}
			var l=nodes.length
				, maxPartNodes = l-1
				, sum = 0
				, halfSum = 0
				, halfVal = 0
				, i = 0
				, splitPos = 0
				,part0,part1
			;
			//-- calc sum of given elements
			if( nodes.sum === undefined ){
				for(sum=0, i=l; i; sum+=this._getNodeValue(nodes[--i]));
			}else{
				sum = nodes.sum;
			}
			if( sum <=0 ){
				return;
			}
			halfSum=Math.floor(sum/2);
			//-- split in 2 equitable part
			for(i=0;halfVal<=halfSum && i<maxPartNodes; halfVal+=this._getNodeValue(nodes[i++]));
			part0 = nodes.slice(0,i);
			part1 = nodes.slice(i);
			//-- avoid sum calculation again
			part0.sum=halfVal;
			part1.sum=sum-halfVal;
			//-- no set rect
			if( nodes.rect.width >= nodes.rect.height){
				splitPos = Math.round(( part0.sum * nodes.rect.width ) / sum);
				part0.rect = $.extend({},nodes.rect,{width:splitPos});
				part1.rect = $.extend({},nodes.rect,{left:nodes.rect.left+splitPos,width:nodes.rect.width-splitPos});
			}else{
				splitPos = Math.round(( part0.sum * nodes.rect.height ) / sum);
				part0.rect = $.extend({},nodes.rect,{height:splitPos});
				part1.rect = $.extend({},nodes.rect,{top:nodes.rect.top+splitPos,height:nodes.rect.height-splitPos});
			}
			this.divideArea(part0);
			this.divideArea(part1);
		}
		,_drawNode:function(node){
			//console.debug('draw',node.id,node);
			if(! node._tmelmt ){
				node._tmelmt = $('<div class="tk-treemap-node"></div>').appendTo(this.elmt);
			}
			//-- execute user drawNode method
			node._tmelmt.html(this._getNodeLabel(node));
			if( this.options.drawNode ){
				this.options.drawNode.call(node._tmelmt,node);
			}
			if( this.options.animDuration > 0){
				node._tmelmt.animate(node._tmrect,this.options.animDuration,this.options.animEasing);
			}else{
				node._tmelmt.css(node._tmrect);
			}
		}
*/