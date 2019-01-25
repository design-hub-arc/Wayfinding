const path = require("path");

module.exports = {
  entry: {
    index: "./src/webpages/index.js",
    classFinder: "./src/webpages/classFinder.js"
  },
  output: {
    path: path.resolve(__dirname, "dist/src/webpages"),
    filename: "[name].js"
  },
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }]
  }
}