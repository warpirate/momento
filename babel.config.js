module.exports = function(api) {
  api.cache(true);
  
  const presets = ['module:@react-native/babel-preset'];
  const plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-runtime', { helpers: true }],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: false,
      },
    ],
  ];

  return {
    presets,
    plugins,
  };
};
