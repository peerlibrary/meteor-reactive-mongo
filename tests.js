// These tests are the same as those in minimongo_tests.js, just that after every batch of database modify queries
// we sleep a bit to allow for changes to propagate back to Meteor and run any observes and invalidate any autoruns.

Tinytest.add("reactive-mongo - reactive stop", function (test) {
  var coll = new LocalCollection();
  coll.insert({_id: 'A'});
  coll.insert({_id: 'B'});
  coll.insert({_id: 'C'});
  Meteor._sleepForMs(100);

  var addBefore = function (str, newChar, before) {
    var idx = str.indexOf(before);
    if (idx === -1)
      return str + newChar;
    return str.slice(0, idx) + newChar + str.slice(idx);
  };

  var x, y;
  var sortOrder = ReactiveVar(1);

  var c = Tracker.autorun(function () {
    var q = coll.find({}, {sort: {_id: sortOrder.get()}});
    x = "";
    q.observe({ addedAt: function (doc, atIndex, before) {
      x = addBefore(x, doc._id, before);
    }});
    y = "";
    q.observeChanges({ addedBefore: function (id, fields, before) {
      y = addBefore(y, id, before);
    }});
  });

  test.equal(x, "ABC");
  test.equal(y, "ABC");

  sortOrder.set(-1);
  test.equal(x, "ABC");
  test.equal(y, "ABC");
  Tracker.flush();
  test.equal(x, "CBA");
  test.equal(y, "CBA");

  coll.insert({_id: 'D'});
  coll.insert({_id: 'E'});
  Meteor._sleepForMs(100);
  test.equal(x, "EDCBA");
  test.equal(y, "EDCBA");

  c.stop();
  // stopping kills the observes immediately
  coll.insert({_id: 'F'});
  Meteor._sleepForMs(100);
  test.equal(x, "EDCBA");
  test.equal(y, "EDCBA");
});

Tinytest.add("reactive-mongo - fetch in observe", function (test) {
  var coll = new LocalCollection;
  var callbackInvoked = false;
  var observe = coll.find().observeChanges({
    added: function (id, fields) {
      callbackInvoked = true;
      test.equal(fields, {foo: 1});
      var doc = coll.findOne({foo: 1});
      test.isTrue(doc);
      test.equal(doc.foo, 1);
    }
  });
  test.isFalse(callbackInvoked);
  var computation = Tracker.autorun(function (computation) {
    if (computation.firstRun) {
      coll.insert({foo: 1});
      Meteor._sleepForMs(100);
    }
  });
  test.isTrue(callbackInvoked);
  observe.stop();
  computation.stop();
});

Tinytest.add("reactive-mongo - count on cursor with limit", function(test){
  var coll = new LocalCollection(), count;

  coll.insert({_id: 'A'});
  coll.insert({_id: 'B'});
  coll.insert({_id: 'C'});
  coll.insert({_id: 'D'});
  Meteor._sleepForMs(100);

  var c = Tracker.autorun(function (c) {
    var cursor = coll.find({_id: {$exists: true}}, {sort: {_id: 1}, limit: 3});
    count = cursor.count();
  });

  test.equal(count, 3);

  coll.remove('A'); // still 3 in the collection
  Meteor._sleepForMs(100);
  Tracker.flush();
  test.equal(count, 3);

  coll.remove('B'); // expect count now 2
  Meteor._sleepForMs(100);
  Tracker.flush();
  test.equal(count, 2);


  coll.insert({_id: 'A'}); // now 3 again
  Meteor._sleepForMs(100);
  Tracker.flush();
  test.equal(count, 3);

  coll.insert({_id: 'B'}); // now 4 entries, but count should be 3 still
  Meteor._sleepForMs(100);
  Tracker.flush();
  test.equal(count, 3);

  c.stop();
});

Tinytest.add("reactive-mongo - fine-grained reactivity of query with fields projection", function (test) {
  var X = new LocalCollection;
  var id = "asdf";
  X.insert({_id: id, foo: {bar: 123}});

  var callbackInvoked = false;
  var computation = Tracker.autorun(function () {
    callbackInvoked = true;
    return X.findOne(id, { fields: { 'foo.bar': 1 } });
  });
  test.isTrue(callbackInvoked);
  callbackInvoked = false;
  X.update(id, {$set: {'foo.baz': 456}});
  Meteor._sleepForMs(100);
  test.isFalse(callbackInvoked);
  X.update(id, {$set: {'foo.bar': 124}});
  Meteor._sleepForMs(100);
  Tracker.flush();
  test.isTrue(callbackInvoked);

  computation.stop();
});
