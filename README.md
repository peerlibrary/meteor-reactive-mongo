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
server-side code which might not expect to be reactive.

Server side only.

Installation
------------

```
meteor add peerlibrary:reactive-mongo
```

Acknowledgments
---------------

This package is based on the great work by [Diggory Blake](https://github.com/Diggsey/meteor-reactive-publish)
who made the first implementation.
