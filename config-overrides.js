// eslint-disable-next-line no-undef
module.exports = function override(config, env) {
  //do stuff with the webpack config...
  setTimeout(() => console.log('config', config.module.rules), 10000)
  // config.module.rules.push({
  //   rules: [
  //     {
  //       test: /\.m?js$/,
  //       exclude: /(node_modules|bower_components)/,
  //       use: {
  //         // `.swcrc` can be used to configure swc
  //         loader: 'swc-loader',
  //       },
  //     },
  //   ],
  // })
  return config
}
