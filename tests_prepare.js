// We are repurposing Minimongo tests to test reactive server-side MongoDB
// collections. So we have to do some preparations here.

originalLocalCollection = LocalCollection;
LocalCollection = function (name, options) {
  // We want always to use MongoDB, not local collections.
  name = name || Random.id();
  // To make Mongo.Collection generate ObjectIDs by default.
  options = options || {};
  options.idGeneration = 'MONGO';
  return new Mongo.Collection(name, options);
};

LocalCollection.wrapTransform = originalLocalCollection.wrapTransform;
LocalCollection._f = originalLocalCollection._f;
LocalCollection._compileProjection = originalLocalCollection._compileProjection;
LocalCollection._binarySearch = originalLocalCollection._binarySearch;

// Currently server and client side behaves differently when counting with skip. So we make it
// behave the same for tests. See https://github.com/meteor/meteor/issues/1201
var SynchronousCursor = Object.getPrototypeOf(MongoInternals.defaultRemoteCollectionDriver().mongo._createSynchronousCursor({'collectionName': 'foobar', 'options': {}})).constructor;
SynchronousCursor.prototype.count = function () {
  return this._synchronousCount({'applySkipLimit': true}).wait();
};

var originalFind = Mongo.Collection.prototype.find;
Mongo.Collection.prototype.find = function (selector, options) {
  // Few tests are expecting an exception for unsupported operators.
  if (options && options.fields && (options.fields.grades || options.fields['grades.$'])) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector.location && selector.location['$not']) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$and'] && selector['$and'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$or'] && selector['$or'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$nor'] && selector['$nor'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }
  if (selector && selector['$and'] && selector['$and'][0]['$and'] && selector['$and'][0]['$and'][0].location) {
    throw new Error("Unsupported in Minimongo");
  }

  // Geo queries need indexes.
  if (selector && selector['rest.loc']) {
    this._ensureIndex({'rest.loc': '2d'});
  }
  if (selector && selector['location']) {
    this._ensureIndex({'location': '2dsphere'});
  }
  if (selector && selector['a.b']) {
    this._ensureIndex({'a.b': '2d'});
  }

  return originalFind.apply(this, arguments);
};

var originalUpdate = Mongo.Collection.prototype.update;
Mongo.Collection.prototype.update = function (selector, mod, options, callback) {
  if (selector && selector['a.b'] && selector['a.b'].$near) {
    this._ensureIndex({'a.b': '2d'});
  }
  if (selector && selector['a.c'] && selector['a.c'].$near) {
    this._ensureIndex({'a.c': '2d'});
  }

  return originalUpdate.apply(this, arguments);
};

var IGNORED_TESTS = [
  // Tests which do not test any reactive behavior, just Minimongo specifics,
  // and use code which does not exist on the server.
  'minimongo - saveOriginals',
  'minimongo - saveOriginals errors',
  'minimongo - pause',
  'minimongo - ids matched by selector',
  'minimongo - lookup',

  // Pending pull requests.
  // See: https://github.com/meteor/meteor/pull/9539
  'minimongo - cursors',

  // Fail because of difference between Minimongo and server. For some of these
  // tests (those with autorun) we have a fixed version in tests.js.
  'minimongo - sort function',
  'minimongo - cannot $set with null bytes',
  'minimongo - cannot insert using invalid field names',
  'minimongo - $near operator tests',
  'minimongo - $near and $geometry for legacy coordinates',
  'minimongo - modify',
  // See: https://github.com/meteor/meteor-feature-requests/issues/252
  'minimongo - basics',
  // See: https://github.com/meteor/meteor/issues/3597
  'minimongo - observe ordered',
  'minimongo - observe ordered: true',
  'minimongo - observe ordered: false',
  'minimongo - observe ordered with projection',
  'minimongo - reactive stop',
  'minimongo - fetch in observe',
  'minimongo - count on cursor with limit',
  'minimongo - reactive skip/limit count while updating',
  'minimongo - fine-grained reactivity of query with fields projection',
];

var originalTinytestAdd = Tinytest.add;
Tinytest.add = function (name, func) {
  if (_.contains(IGNORED_TESTS, name)) return;
  return originalTinytestAdd.call(Tinytest, name, func);
};
