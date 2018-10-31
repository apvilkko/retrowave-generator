const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const entry = process.env.APP_ENV === 'testbed' ? './src/testbed/index.js' : './src/index.js';

module.exports = {
  mode: 'development',
  entry: ['@babel/polyfill', entry],
  output: {
    path: path.resolve(__dirname, './dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-object-rest-spread'],
          }
        }
      }
    ]
  },
  devtool: 'source-map',
  plugins: [new HtmlWebpackPlugin()],
  devServer: {
    contentBase: path.resolve('./public')
  }
}
