
/* MERGE CONST */
const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")
const path = require("path")

/* PLUGINS ET UTILITIES */
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const PurgecssPlugin = require("purgecss-webpack-plugin")

/* CRITICAL CSS */
const dotenv = require("dotenv").config(path.resolve(__dirname, ".env"))
const devURL = dotenv.parsed.SITE_URL
const HtmlCriticalWebpackPlugin = require("html-critical-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

/* PRODUCTION OPTIMIZATION */
const TerserPlugin = require("terser-webpack-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")

/* Glob and Path used by PURGE CSS to easily get a list of files */
const glob = require("glob")
const PATHS = {
   src: path.join(__dirname, "templates")
}

module.exports = merge(common, {

   // mode is required
   mode: "production",
   // output with hash for production
   output: {
      filename: "[name].[contenthash].js",
      clean: true,
      chunkFilename: "chunks/chunk~[name].[contenthash].js"
   },
   // webpack 5 new config for output comment
   stats: {
      assets: true,
      builtAt: true,
      entrypoints: false,
      outputPath: false
   },

   // plugins
   plugins: [

      new MiniCssExtractPlugin({
         filename: "[name].[contenthash].css",
         chunkFilename: "chunks/chunk~[name].[contenthash].css"
      }),

      new PurgecssPlugin({
         paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
         defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || [],
         safelist: {
            deep: [/active/, /open/, /shrink/, /shrinked/, /data/, /current/, /richtext/, /wysiwyg/, /swiper/, /carousel/, /show/]
         }
      }),

      new HtmlCriticalWebpackPlugin({
         base: path.resolve(__dirname, "templates/_base/critical"),
         src: devURL,
         dest: "critical.css",
         inline: false,
         minify: true,
         extract: false,
         width: 1440,
         height: 900,
         penthouse: {
            blockJSRequests: false
         }
      }),

      new HtmlWebpackPlugin({
         filename: path.resolve(__dirname, "templates/_base/hash/non-critical.twig"),
         template: path.resolve(__dirname, "src/ejs/non-critical.ejs"),
         inject: false
      })

   ], // END PLUGINS

   module: {
      rules: [
         {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            /*
        * Babel is use only for production for old browser
        */
            use: {
               loader: "babel-loader",
               options: {
                  presets: ["@babel/preset-env"],
                  plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-syntax-dynamic-import"]
               }
            }
         }
      ] // end rules
   }, // end modules for production

   /*
  * Minify tool - default webpack settings
  */
   optimization: {
      minimize: true,
      minimizer: [
         new TerserPlugin({
            terserOptions: {
               output: {
                  comments: false
               }
            },
            extractComments: false
         }),
         new CssMinimizerPlugin({
            minimizerOptions: {
               preset: [
                  "default",
                  {
                     discardComments: { removeAll: true }
                  }
               ]
            }
         })
      ],
      splitChunks: {
         chunks: "all"
      }
   }

}) // end module exports
