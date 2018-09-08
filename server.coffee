MeteorCursor = Object.getPrototypeOf(MongoInternals.defaultRemoteCollectionDriver().mongo.find()).constructor

originalObserveChanges = MeteorCursor::observeChanges
originalCount = MeteorCursor::count

# This is a PeerDB extension. It might not exist if the package is used without PeerDB.
# But we defined a week dependency on PeerDB so that it is loaded before this package
# to that PeerDB adds this extension before we get here.
originalExists = MeteorCursor::exists

MeteorCursor::_isReactive = ->
  # By default we make all cursors reactive. But you can
  # still disable that, the same as on the client.
  @_cursorDescription.options.reactive ? true

MeteorCursor::_depend = (changers) ->
  return unless Tracker.active

  dependency = new Tracker.Dependency()
  dependency.depend()

  # On server side observe does not have _suppress_initial,
  # so we are skipping initial documents manually.
  initializing = true

  options = {}
  for fnName in ['added', 'changed', 'removed', 'addedBefore', 'movedBefore'] when changers[fnName]
    options[fnName] = ->
      dependency.changed() unless initializing

  # observeChanges will stop() when this computation is invalidated.
  @observeChanges options

  initializing = false

MeteorCursor::observeChanges = (options) ->
  handle = originalObserveChanges.call @, options
  if Tracker.active and @_isReactive()
    Tracker.onInvalidate =>
      handle.stop()
  handle

callbacksOrdered =
  addedBefore: true
  removed: true
  changed: true
  movedBefore: true

callbacksUnordered =
  added: true
  changed: true
  removed: true

for method in ['forEach', 'map', 'fetch']
  do (method) ->
    originalMethod = MeteorCursor::[method]
    MeteorCursor::[method] = (args...) ->
      if @_isReactive()
        ordered = @skip || (@limit && !@sort)
        callbacks = if ordered then callbacksOrdered else callbacksUnordered
        # callbacks = callbacksUnordered
        @_depend callbacks

      originalMethod.apply @, args

MeteorCursor::count = (args...) ->
  if @_isReactive()
    @_depend
      added: true
      removed: true

  originalCount.apply @, args

if originalExists
  MeteorCursor::exists = (args...) ->
    if @_isReactive()
      @_depend
        added: true
        removed: true

    originalExists.apply @, args
