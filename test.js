const luaparse = require("./index")

var parser = luaparse.parse('while true do continue end', { luaVersion: "6.0" })

console.log(JSON.stringify(parser, null, 2));