const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const prod = process.argv.includes("-p");

module.exports = {
  devtool: prod ? "source-map" : "inline-source-map",
  entry: "./src/App.tsx",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/bundle.js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  devServer: {
    contentBase: path.join(__dirname, "public"),
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
        ],
      },
      {
        // Include ts(x) and js(x) files.
        test: /\.(ts|js)x?$/,
        exclude: [/node_modules/],
        loader: "babel-loader",
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/bundle.css",
    }),
  ],
};
