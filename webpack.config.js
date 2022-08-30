const path = require("path");

//console.log(path.resolve(__dirname, "assets", "js"));

module.exports = {
  entry: {
    main: "./src/client/js/main.js",
    checkBOJ: "./src/client/js/checkBOJ.js",
  },
  output: {
    filename: "js/[name].js",
    path: path.resolve(__dirname, "assets"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
    ],
  },
};
