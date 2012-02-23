/*
==================================================================================================
  Core - JavaScript Foundation
  Copyright 2010-2012 Sebastian Werner
--------------------------------------------------------------------------------------------------
  Based on the work of:
  Hogan.JS by Twitter, Inc.
  https://github.com/twitter/hogan.js
  Licensed under the Apache License, Version 2.0
  http://www.apache.org/licenses/LICENSE-2.0
==================================================================================================
*/

(function () 
{
	var rSlash = /\\/g;
	var rQuot = /\"/g;
	var rNewline = /\n/g;
	var rCr = /\r/g;
	
	var accessTags = {
		"#" : 1,
		"?" : 1,
		"^" : 1,
		"&" : 1,
		"$" : 1
	};
	
	var innerTags = {
		"#" : 1,
		"?" : 1,
		"^" : 1
	};

	function esc(s) {
		return s.replace(rSlash, '\\\\').replace(rQuot, '\\\"').replace(rNewline, '\\n').replace(rCr, '\\r');
	}

	function walk(node) 
	{
		var code = '';
		var tag, name;
		
		for (var i = 0, l = node.length; i < l; i++) 
		{
			var current = node[i];
			var tag = current.tag;
			
			if (tag == null) 
			{
				code += 'buf+="' + esc(current) + '";';
			}
			else
			{
				var name = current.name;
				var escaped = esc(name);
				
				if (accessTags[tag]) {
					var accessMethod = ~name.indexOf('.') ? '_getDotted' : '_get';
				}
				
				if (innerTags[tag]) {
					var innerCode = walk(current.nodes);
				}
				
				if (tag == '?') {
					code += 'if(this._is(this.' + accessMethod + '("' + escaped + '",data,true))){' + innerCode + '};';
				} else if (tag == '^') {
					code += 'if(!this._is(this.' + accessMethod + '("' + escaped + '",data,true))){' + innerCode + '};';
				} else if (tag == '#') {
					code += 'this._section(this.' + accessMethod + '("' + escaped + '",data,true),partials,function(data,partials){' + innerCode + '});';
				} else if (tag == '&') {
					code += 'buf+=this._data(this.' + accessMethod + '("' + escaped + '",data));';
				} else if (tag == '$') {
					code += 'buf+=this._variable(this.' + accessMethod + '("' + escaped + '",data));';
				} else if (tag == '>') {
					code += 'buf+=this._partial("' + escaped + '",data,partials);';
				} else if (tag == '\n') {
					code += 'buf+="\\n";';
				}
			}
		}
		
		console.debug("CODE: ", code);
		
		return code;
	}


	/**
	 * This is the Compiler of the template engine and transforms the token tree into a compiled template instance.
	 */
	core.Module("core.template.Compiler", 
	{
		/**
		 * {core.template.Template} Translates the @code {Array} tree from {#parse} into actual JavaScript 
		 * code (in form of a {core.template.Template} instance) to insert dynamic data fields. It uses
		 * the original @text {String} for template construction. Optionally you can remove white spaces (line breaks,
		 * leading, trailing, etc.) by enabling @strip {Boolean?false}.
		 */
		compile : function(text, strip) {

			var tree = core.template.Parser.parse(text, strip);
			var wrapped = 'var buf="";' + walk(tree) + 'return buf;';

			return new core.template.Template(new Function('data', 'partials', wrapped), text);
		}
	});
	
})();