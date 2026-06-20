const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) manifest.queries = [];

    const newIntent = {
      action: [{ $: { 'android:name': 'android.intent.action.SENDTO' } }],
      data: [{ $: { 'android:scheme': 'mailto' } }]
    };

    if (manifest.queries.length === 0) {
      manifest.queries.push({ intent: [newIntent] });
    } else {
      if (!manifest.queries[0].intent) manifest.queries[0].intent = [];
      manifest.queries[0].intent.push(newIntent);
    }
    return config;
  });
};
