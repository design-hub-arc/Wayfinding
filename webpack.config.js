const path = require("path");

module.exports = {
  mode: "development",
  entry: {
    index: "./src/webpages/index.js",
    classFinder: "./src/webpages/classFinder.js"
  },
  output: {
    path: path.resolve(__dirname, "dist/src"),
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