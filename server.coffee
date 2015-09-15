MeteorCursor = Object.getPrototypeOf(MongoInternals.defaultRemoteCollectionDriver().mongo.find()).constructor

originalObserveChanges = MeteorCursor::observeChanges
originalForEach = MeteorCursor::forEach
originalCount = MeteorCursor::count

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
  handle = Tracker.nonreactive =>
    originalObserveChanges.call @, options
  if Tracker.active and @_isReactive()
    Tracker.onInvalidate =>
      handle.stop()
  handle

MeteorCursor::forEach = (args...) ->
  if @_isReactive()
    @_depend
      addedBefore: true
      removed: true
      changed: true
      movedBefore: true

   originalForEach.apply @, args

MeteorCursor::count = (args...) ->
  if @_isReactive()
    @_depend
      added: true
      removed: true

   originalCount.apply @, args
