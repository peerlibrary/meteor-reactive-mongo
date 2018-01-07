Package.describe({
  summary: "Reactive server-side MongoDB queries",
  version: '0.1.1',
  name: 'peerlibrary:reactive-mongo',
  git: 'https://github.com/peerlibrary/meteor-reactive-mongo.git'
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.0.3.1');

  // Core dependencies.
  api.use([
    'coffeescript@=2.0.3-2-rc161.0',
    'underscore',
    'mongo'
  ], 'server');

  // 3rd party dependencies.
  api.use([
    'peerlibrary:server-autorun@0.5.1'
  ], 'server');

  // Package can be used without PeerDB. But if PeerDB is available, make
  // sure it is loaded before this package so that PeerDB adds "exists"
  // to the cursor before we make it reactive.
  api.use([
    'peerlibrary:peerdb@0.19.1'
  ], 'server', {'weak': true});

  api.addFiles([
    'server.coffee'
  ], 'server');
});

Package.onTest(function (api) {
  // Core dependencies.
  api.use([
    'tinytest',
    'test-helpers',
    'mongo',
    'underscore',
    'reactive-var',
    'random',
    'minimongo',
    'ejson',
    'mongo-id'
  ], 'server');

  // 3rd party dependencies.
  api.use([
    'peerlibrary:server-autorun@0.5.1'
  ], 'server');

  // Internal dependencies.
  api.use([
    'peerlibrary:reactive-mongo'
  ]);

  api.add_files([
    // We modify environment to make Minimongo tests in fact use MongoDB database.
    'tests_prepare.js',
    'meteor/packages/minimongo/minimongo_tests.js',
    'tests.js'
  ], 'server');
});
