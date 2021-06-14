/**
 * Set a trigger to execute a function after a specified time, caching a parameter for the function.
 * The callback function should delete the trigger to avoid leaving old triggers against the quota
 * @param {string} functionName 
 * @param {integer} delay       Delay in ms
 * @param {}
 */
function setContinuationTrigger(functionName, delay, cacheParam) {
  delay = delay || 1000
  var trigger = ScriptApp.newTrigger(functionName)
      .timeBased()
      .after(delay)
      .create();
  var triggerId = trigger.getUniqueId();
  console.log('Function %s will run in %s ms with trigger ID %s.', functionName, delay, triggerId)
  if (cacheParam) {
    CacheService.getScriptCache().put(triggerId+'_param', cacheParam, Math.floor(delay / 1000 * 2))
    console.log("Cached trigger parameter %s", cacheParam)
  }

  return triggerId
}

/**
 * Use this to delete the trigger that launched this callback
 * @param {Event} e Trigger event
 */
function continuationFunction(e)  {
  // Remove the one-time trigger that called this.
  if (e && e.triggerUid) {
    deleteTriggerById(e.triggerUid)
    console.log("Deleted one-off trigger with id %s", e.triggerUid)
    var param = CacheService.getScriptCache().get(e.triggerUid + '_param') 
  }
  // do stuff here...
}



/**
 * Delete any trigger assigned to the given function.
 * @param {string} id 
 */
function deleteTriggerById(id) {
  // Find all existing triggers for the function, if they exist, and delete them
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getUniqueId() == id) {
      console.log("Removing trigger for '%s' with id %s", trigger.getHandlerFunction(), id)
      ScriptApp.deleteTrigger(trigger);
    }
  })
}
