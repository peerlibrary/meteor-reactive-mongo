Package.describe({
  summary: "Reactive server-side MongoDB queries",
  version: '0.4.1',
  name: 'peerlibrary:reactive-mongo',
  git: 'https://github.com/peerlibrary/meteor-reactive-mongo.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.8.1');

  // Core dependencies.
  api.use([
    'coffeescript@2.4.1',
    'ecmascript',
    'underscore',
    'mongo'
  ], 'server');

  // 3rd party dependencies.
  api.use([
    'peerlibrary:server-autorun@0.8.0'
  ], 'server');

  // Package can be used without PeerDB. But if PeerDB is available, make
  // sure it is loaded before this package so that PeerDB adds "exists"
  // to the cursor before we make it reactive.
  api.use([
    'peerlibrary:peerdb@0.27.0'
  ], 'server', {'weak': true});

  api.addFiles([
    'server.coffee'
  ], 'server');
});

Package.onTest(function (api) {
  api.versionsFrom('METEOR@1.8.1');

  // Core dependencies.
  api.use([
    'ecmascript',
    'tinytest',
    'test-helpers',
    'mongo',
    'underscore',
    'reactive-var',
    'random',
    'minimongo',
    'ejson',
    'mongo-id',
    'id-map'
  ], 'server');

  // 3rd party dependencies.
  api.use([
    'peerlibrary:server-autorun@0.8.0'
  ], 'server');

  // Internal dependencies.
  api.use([
    'peerlibrary:reactive-mongo'
  ]);

  api.addFiles([
    // We modify environment to make Minimongo tests in fact use MongoDB database.
    'tests_prepare.js',
    'meteor/packages/minimongo/matcher.js',
    'meteor/packages/minimongo/minimongo_tests.js',
    'meteor/packages/minimongo/minimongo_tests_client.js',
    'meteor/packages/minimongo/minimongo_tests_server.js',
    'tests.js'
  ], 'server');
});
