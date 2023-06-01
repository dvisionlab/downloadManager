const path = require("path");
const { merge } = require("webpack-merge");
const commonConfiguration = require("./webpack.common.js");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = merge(commonConfiguration, {
  entry: path.resolve(__dirname, "../src/downloadManager.ts"),
  mode: "production",
  optimization: { minimize: false },
  plugins: [new CleanWebpackPlugin()]
});
