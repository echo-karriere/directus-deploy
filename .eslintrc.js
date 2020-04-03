module.exports = {
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "babel-eslint"
  },
  env: {
    node: true,
    commonjs: true,
    browser: true,
    es6: true
  },
  plugins: ["vue"],
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "prettier",
    "prettier/vue"
  ]
};
