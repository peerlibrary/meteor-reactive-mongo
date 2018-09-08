reactive-mongo
==============

Meteor smart package which provides a fully reactive server-side MongoDB queries. This allows them to be used
in [server-side autorun](https://github.com/peerlibrary/meteor-server-autorun), together with other
fibers-enabled synchronous ([blocking](https://github.com/peerlibrary/meteor-blocking)) code.

Adding this package to your [Meteor](http://www.meteor.com/) application will make all MongoDB queries
reactive by default (you can still specify [`reactive: false`](http://docs.meteor.com/#/full/find) to
queries to disable reactivity for a specific query, or use
[`Tracker.nonreactive`](http://docs.meteor.com/#/full/tracker_nonreactive)). It will also automatically enable
[server-side autorun](https://github.com/peerlibrary/meteor-server-autorun). All this might break some existing
server-side code which might not expect to be reactive. Inspect locations where your code or packages you are using
already (before using this package) call `Tracker.autorun` on the server. In most cases this occurs only in the code
which is shared between client and server.

Server side only.

Installation
------------

```
meteor add peerlibrary:reactive-mongo
```

Polling vs. Oplog inside autoruns
------------
A common use case for server autoruns is using a `findOne` to do a reactive join. Meteor's server-side `findOne` is simply a `find(selector, { limit: 1 }).fetch()[0]` [under the hood](https://github.com/meteor/meteor/blob/devel/packages/mongo/mongo_driver.js#L784). [Because Meteor Oplog does not support](https://galaxy-guide.meteor.com/apm-optimize-your-app-for-oplog.html#Limit-Without-Sort) `limit` without `sort`, calling `Collection.findOne(someId)` in a server autorun will default to using polling.

If you'd like queries inside a server autorun to use Oplog, you'll need to specify a sort for your `findOne` like so:

```
// Server code

// Will use oplog
Tracker.autorun(() => {
  Collection.findOne(someId, { sort: { _id: 1 } });
});

// Will use polling because no sort is specified
Tracker.autorun(() => {
  Collection.findOne(someId);
});
```

Alternatively, if you want to force polling while using a `sort` and `limit` (since [depending on your use case, it could be more efficient](https://blog.meteor.com/tuning-meteor-mongo-livedata-for-scalability-13fe9deb8908)), you can add the disableOplog option to the find:

```
// Server code

// Will use polling
Tracker.autorun(() => {
  Collection.find({ topic: 'Programming' }, { sort: { title: 1 }, limit: 50, disableOplog: true });
});
```

Acknowledgments
---------------

This package is based on the great work by [Diggory Blake](https://github.com/Diggsey/meteor-reactive-publish)
who made the first implementation.
