const luaparse = require("./index")

var parser = luaparse.parse('function add(x, y) return 0 break defer 5/3*2 return x + y end', { luaVersion: "6.0" })

console.log(JSON.stringify(parser, null, 2));