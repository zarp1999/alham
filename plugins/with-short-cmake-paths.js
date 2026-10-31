const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = config => withAppBuildGradle(config, config => {
  const marker = '// Short object paths for Windows native builds';
  if (!config.modResults.contents.includes(marker)) {
    config.modResults.contents += '\n' + marker + '\nandroid { defaultConfig { externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=240" } } } }\n';
  }
  config.modResults.contents = config.modResults.contents.replace("CMAKE_OBJECT_PATH_MAX=128", "CMAKE_OBJECT_PATH_MAX=240");
  return config;
});
