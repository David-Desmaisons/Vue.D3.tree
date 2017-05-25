var config = require('../config')
var webpack = require('webpack')
var merge = require('webpack-merge')
var utils = require('./utils')
var baseWebpackConfig = require('./webpack.base.conf')
var HtmlWebpackPlugin = require('html-webpack-plugin')

// add hot-reload related code to entry chunks
module.exports = merge(baseWebpackConfig, {
  entry: {
    app1: ['./build/dev-client'].concat('./example/tree/main.js'),
    app2: ['./build/dev-client'].concat('./example/hierarchicalEdgeBundling/main.js')
  },
  module: {
    loaders: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
   output: {
    path: __dirname,
    filename: "apps/[name]/build/bundle.js"
  },
  // eval-source-map is faster for development
  devtool: '#eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: './example/tree/index.html',
      template: './example/tree/index.html',
      chunks: ['app1'],
      inject: true
    }),
    new HtmlWebpackPlugin({
      filename: './example/heb/index.html',
      template: './example/hierarchicalEdgeBundling/index.html',
      chunks: ['app2'],
      inject: true
    })
  ]
})
