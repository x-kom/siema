const path = require('path');
const webpack = require('webpack');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
  entry: './src/siema.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'siema.min.js',
    library: 'Siema',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      ...(!process.env.DEV_SIEMA_DEST ? [{
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
      }] : []),
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['babel-plugin-add-module-exports'],
        },
      },
    ]
  },
  devtool: process.env.DEV_SIEMA_DEST ? 'inline-source-map' : false,
  plugins: [
    ...(
      !process.env.DEV_SIEMA_DEST ?
        [
          new webpack.optimize.UglifyJsPlugin({
            minimize: !process.env.DEV_SIEMA_DEST,
          })
        ] : [
          new WebpackShellPlugin({
            // onBuildStart: ['echo "Build start"'],
            onBuildEnd: process.env.DEV_SIEMA_DEST ? [`cp ./dist/siema.min.js ${process.env.DEV_SIEMA_DEST}`, 'echo "Copied"'] : [],
            dev: false,
          })
        ]
    )
  ],
};
