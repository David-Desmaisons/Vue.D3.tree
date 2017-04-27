var path = require('path')
var config = require('../config')
var utils = require('./utils')
var webpack = require('webpack')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : config.build.env

var webpackConfig = merge(baseWebpackConfig, {
  entry: {
    "index": './src/index.js'
  },
  externals: {
    "vue": {
      root: 'Vue',
      commonjs2: 'vue',
      commonjs: 'vue',
      amd: 'vue'
    },
    "d3": {
      root: 'd3',
      commonjs2: 'd3',
      commonjs: 'd3',
      amd: 'd3'
    },
    "d3-hierarchy": {
      root: 'd3-hierarchy',
      commonjs2: 'd3-hierarchy',
      commonjs: 'd3-hierarchy',
      amd: 'd3-hierarchy'
    },
    "vue-resize-directive": {
      root: 'Vueresize',
      commonjs2: 'vue-resize-directive',
      commonjs: 'vue-resize-directive',
      amd: 'vue-resize-directive'
    }
  },
  module: {
    loaders: utils.styleLoaders({ sourceMap: config.build.productionSourceMap, extract: false })
  },
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  output: {
    path: config.build.assetsRoot,
    filename: 'index.js',
    library: 'vueD3Tree',
    libraryTarget: "umd"
  },
  vue: {
    loaders: utils.cssLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: false
    })
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    // extract css into its own file
 /*   new ExtractTextPlugin(utils.assetsPath('css/[name].[contenthash].css')),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: process.env.NODE_ENV === 'testing'
        ? 'index.html'
        : config.build.index,
      template: 'index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency'
    })*/
  ]
})

module.exports = webpackConfig
