# luaparse-lua6.0

A Lua parser written in JavaScript, originally written by Oskar Schöldström for his bachelor's thesis at Arcada.
This is a modified version to support the custom unofficial lua version: `Lua 6.0`.

## Usage

CommonJS

```js
var parser = require('luaparse');
var ast = parser.parse('i = 0');
console.log(JSON.stringify(ast));
```

AMD

```js
require(['luaparse'], function(parser) {
	var ast = parser.parse('i = 0');
	console.log(JSON.stringify(ast));
});
```

Browser

```html
<script src="luaparse.js"></script>
<script>
var ast = luaparse.parse('i = 0');
console.log(JSON.stringify(ast));
</script>
```

## Parser Interface

Basic usage:

```js
luaparse.parse(code, options);
```

The output of the parser is an Abstract Syntax Tree (AST) formatted in JSON.

The available options are:

- `wait: false` Explicitly tell the parser when the input ends.
- `comments: true` Store comments as an array in the chunk object.
- `scope: false` Track identifier scopes.
- `locations: false` Store location information on each syntax node.
- `ranges: false` Store the start and end character locations on each syntax
	node.
- `onCreateNode: null` A callback which will be invoked when a syntax node
	has been completed. The node which has been created will be passed as the
	only parameter.
- `onCreateScope: null` A callback which will be invoked when a new scope is
	created.
- `onDestroyScope: null` A callback which will be invoked when the current
	scope is destroyed.
- `onLocalDeclaration: null` A callback which will be invoked when a local
	variable is declared. The identifier will be passed as the only parameter.
- `luaVersion: '6.0'` The version of Lua the parser will target; supported
	values are only `'6.0'` for now.
- `extendedIdentifiers: false` Whether to allow code points ≥ U+0080 in
	identifiers, like LuaJIT does. **Note:** setting `luaVersion: 'LuaJIT'`
	currently does *not* enable this option; this may change in the future.
- `encodingMode: 'none'` Defines the relation between code points ≥ U+0080
	appearing in parser input and raw bytes in source code, and how Lua escape
	sequences in JavaScript strings should be interpreted. See the
	[Encoding modes](#encoding-modes) section below for more information.

The default options are also exposed through `luaparse.defaultOptions` where
they can be overriden globally.

There is a second interface which might be preferable when using the `wait`
option.

```js
var parser = luaparse.parse({ wait: true });
parser.write('foo = "');
parser.write('bar');
var ast = parser.end('"');
```

This would be identical to:

```js
var ast = luaparse.parse('foo = "bar"');
```

### AST format

If the following code is executed:

```js
luaparse.parse('foo = "bar"');
```

then the returned value will be:

```js
{
	"type": "Chunk",
	"body": [
		{
			"type": "AssignmentStatement",
			"variables": [
				{
					"type": "Identifier",
					"name": "foo"
				}
			],
			"init": [
				{
					"type": "StringLiteral",
					"value": "bar",
					"raw": "\"bar\""
				}
			]
		}
	],
	"comments": []
}
```

### Encoding modes

Unlike strings in JavaScript, Lua strings are not Unicode strings, but
bytestrings (sequences of 8-bit values); likewise, implementations of Lua
parse the source code as a sequence of octets. However, the input to this
parser is a JavaScript string, i.e. a sequence of 16-bit code units (not
necessarily well-formed UTF-16). This poses a problem of how those code
units should be interpreted, particularly if they are outside the Basic
Latin block ('ASCII').

The `encodingMode` option specifies how these issues should be handled.
Possible values are as follows:

- `'none'`: Source code characters all pass through as-is and string
	literals are not interpreted at all; the string literal nodes contain
	the value `null`. This is the default mode.
- `'x-user-defined'`: Source code has been decoded with the WHATWG
	`x-user-defined` encoding; escapes of bytes in the range \[0x80, 0xff]
	are mapped to the Unicode range \[U+F780, U+F7FF].
- `'pseudo-latin1'`: Source code has been decoded with the IANA
	`iso-8859-1` encoding; escapes of bytes in the range \[0x80, 0xff]
	are mapped to Unicode range \[U+0080, U+00FF]. Note that this is
	**not** the same as how WHATWG standards define the `iso-8859-1`
	encoding, which is to say, as a synonym of `windows-1252`.

### Custom AST

The default AST structure is somewhat inspired by the Mozilla Parser API but
can easily be overriden to customize the structure or to inject custom logic.

`luaparse.ast` is an object containing all functions used to create the AST, if
you for example wanted to trigger an event on node creations you could use the
following:

```js
var luaparse = require('luaparse'),
		events = new (require('events').EventEmitter);

Object.keys(luaparse.ast).forEach(function(type) {
	var original = luaparse.ast[type];
	luaparse.ast[type] = function() {
		var node = original.apply(null, arguments);
		events.emit(node.type, node);
		return node;
	};
});
events.on('Identifier', function(node) { console.log(node); });
luaparse.parse('i = "foo"');
```

_this is only an example to illustrate what is possible and this particular
example might not suit your needs as the end location of the node has not been
determined yet. If you desire events you should use the `onCreateNode` callback
instead)._


### Lexer

The lexer used by luaparse can be used independently of the recursive descent
parser. The lex function is exposed as `luaparse.lex()` and it will return the
next token up until `EOF` is reached.

Each token consists of:

- `type` expressed as an enum flag which can be matched with `luaparse.tokenTypes`.
- `value`
- `line`, `lineStart`
- `range` can be used to slice out raw values, eg. `foo = "bar"` will return a
`StringLiteral` token with the value `bar`. Slicing out the range on the other
hand will return `"bar"`.

```js
var parser = luaparse.parse('foo = "bar"', { wait: true });
parser.lex(); // { type: 8, value: "foo", line: 1, lineStart: 0, range: [0, 3] }
parser.lex(); // { type: 32, value: "=", line: 1, lineStart: 0, range: [4, 5]}
parser.lex(); // { type: 2, value: "bar", line: 1, lineStart: 0, range: [6, 11] }
parser.lex(); // { type: 1, value: "<eof>", line: 1, lineStart: 0, range: [11 11] }
parser.lex(); // { type: 1, value: "<eof>", line: 1, lineStart: 0, range: [11 11] }
```

## License

MIT

[luaparse]: https://github.com/fstirlitz/luaparse
[luaminify]: https://github.com/stravant/LuaMinify
[yueliang]: http://yueliang.luaforge.net/
[lua]: https://www.lua.org
[esprima]: http://esprima.org
[wtf8]: https://simonsapin.github.io/wtf-8/
