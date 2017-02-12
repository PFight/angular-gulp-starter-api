var nodeResolve = require('rollup-plugin-node-resolve');
var nodePath = require("path");

var rxjsEs6Dir = nodePath.resolve(__dirname + "/../rxjs-es6") + "/";

class RollupNG2 {
  resolveId(id, from) {
    if (id.startsWith('rxjs/')) {
        return nodePath.resolve(`${id.replace('rxjs/', rxjsEs6Dir)}.js`);
    }
    return undefined;
  }
}

const rollupNG2 = () => new RollupNG2();

module.exports = {
  sourceMap: false,
  treeshake: true,
  format: 'iife',
  context: 'window',
  plugins: [
    rollupNG2(),
    nodeResolve({
      jsnext: true, main: true, module: true
    })
  ],
  onwarn: function ( message ) {
    console.warn( message );
  }
};
