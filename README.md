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

Invalidating computations on Ordered vs. Unordered cursors
------------
In Meteor, there's a concept of `ordered` cursors. If a cursor is `ordered`, then when the order of the documents in the result set changes, the computation will be invalidated and the `autorun` will re-run.

By default, this package will use an ordered cursor if a `sort` is present in the query. If no `sort` is specified, it will use an unordered cursor.

To override the defualt functionality, you can explicitly force or un-force `ordered` by passing an `ordered` option to your `find`:

```
// Server code

// Will use ordered since a sort is present
Tracker.autorun(() => {
  Posts.find({ topic: 'news' }, { sort: { name: 1 } }).fetch();
});

// Will use unordered since no sort is present
Tracker.autorun(() => {
  Posts.find({ topic: 'news' }).fetch();
});

// Will not use ordered since the option is forced to "false"
Tracker.autorun(() => {
  Posts.find({ topic: 'news' }, { sort: { name: 1 }, ordered: false }).fetch();
});

// Will use ordered since the option is forced to "true"
Tracker.autorun(() => {
  Posts.find({ topic: 'news' }, ordered: true }).fetch();
});
```

Polling vs. Oplog inside autoruns
------------
A common use case for server autoruns is using a `findOne` to do a reactive join. Meteor's server-side `findOne` is a `find(selector, { limit: 1 }).fetch()[0]` [under the hood](https://github.com/meteor/meteor/blob/devel/packages/mongo/mongo_driver.js#L784). [Because Meteor Oplog does not support](https://galaxy-guide.meteor.com/apm-optimize-your-app-for-oplog.html#Limit-Without-Sort) `limit` without `sort`, calling `Collection.findOne(someId)` in a server autorun will default to using polling.


If you'd like queries inside a server autorun to use Oplog, you'll need to specify a sort for your `findOne` **and** pass `ordered: false` to use unordered cursor:

```
// Server code

// Will use oplog since it has sort, limit, and is unordered
Tracker.autorun(() => {
  Collection.findOne(someId, { sort: { _id: 1 }, ordered: false });
});

// Will use polling because a limit (from findOne) but no sort is specified
Tracker.autorun(() => {
  Collection.findOne(someId);
});
```


Acknowledgments
---------------

This package is based on the great work by [Diggory Blake](https://github.com/Diggsey/meteor-reactive-publish)
who made the first implementation.
