const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    yjs: './node_modules/yjs/dist/yjs.cjs',
    'y-websocket': './node_modules/y-websocket/dist/y-websocket.cjs'
  },
  output: {
    path: path.resolve(__dirname, 'public/js'),
    filename: '[name].min.js',
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    fallback: {
      "buffer": false,
      "crypto": false,
      "fs": false,
      "path": false,
      "os": false
    }
  }
};