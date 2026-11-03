// Expo config plugin: карта Google всегда с подписями на украинском,
// независимо от языка телефона (как в оригинальном Uklon).
const {
  withMainApplication,
  withMainActivity,
  withInfoPlist,
} = require('@expo/config-plugins');

const MARK = 'LOCALE_UK';

function patchApplication(src, language) {
  if (src.includes(MARK)) return src;
  if (language === 'kt') {
    return src.replace(
      /(super\.onCreate\(\)[ \t]*\r?\n)/,
      `$1    java.util.Locale.setDefault(java.util.Locale("uk", "UA")) // ${MARK}\n`
    );
  }
  return src.replace(
    /(super\.onCreate\(\);[ \t]*\r?\n)/,
    `$1    java.util.Locale.setDefault(new java.util.Locale("uk", "UA")); // ${MARK}\n`
  );
}

function patchActivity(src, language) {
  if (src.includes(MARK)) return src;
  if (language === 'kt') {
    const m = src.match(/class MainActivity[^{]*\{\r?\n/);
    if (!m) return src;
    const code = `
  // ${MARK}: подписи на карте Google — на украинском независимо от языка телефона
  override fun attachBaseContext(newBase: android.content.Context) {
    val locale = java.util.Locale("uk", "UA")
    java.util.Locale.setDefault(locale)
    val config = android.content.res.Configuration(newBase.resources.configuration)
    config.setLocale(locale)
    super.attachBaseContext(newBase.createConfigurationContext(config))
  }
`;
    return src.replace(m[0], m[0] + code);
  }
  const m = src.match(/public class MainActivity[^{]*\{\r?\n/);
  if (!m) return src;
  const code = `
  // ${MARK}
  @Override
  protected void attachBaseContext(android.content.Context newBase) {
    java.util.Locale locale = new java.util.Locale("uk", "UA");
    java.util.Locale.setDefault(locale);
    android.content.res.Configuration config = new android.content.res.Configuration(newBase.getResources().getConfiguration());
    config.setLocale(locale);
    super.attachBaseContext(newBase.createConfigurationContext(config));
  }
`;
  return src.replace(m[0], m[0] + code);
}

module.exports = function withUkrainianMaps(config) {
  config = withMainApplication(config, (cfg) => {
    cfg.modResults.contents = patchApplication(cfg.modResults.contents, cfg.modResults.language);
    return cfg;
  });
  config = withMainActivity(config, (cfg) => {
    cfg.modResults.contents = patchActivity(cfg.modResults.contents, cfg.modResults.language);
    return cfg;
  });
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleDevelopmentRegion = 'uk';
    cfg.modResults.CFBundleLocalizations = ['uk'];
    return cfg;
  });
  return config;
};
module.exports.patchApplication = patchApplication;
module.exports.patchActivity = patchActivity;
