/**
 * Utilities for interfacing with HighLevel API
 * http://developers.gohighlevel.com/
 */
var HighLevelLocation = (function(ns) {
  var HIGHLEVEL_API_KEY

  // Initialize the HL API by getting the API key for this location from the spreadsheet
  ns.setApiKey = function(key) {
    HIGHLEVEL_API_KEY = key;
    return ns
  }

  ns.getUsers = function() {
    return callHighLevel('get','users/')
  }

  ns.getOpportunities = function(pipelineId) {
    // Requires pagination
    var endpointRoot = 'pipelines/' + pipelineId + '/opportunities?limit=20'
    var endpoint = endpointRoot
    var opportunities = []
    do {
      var result = callHighLevel('get', endpoint)
      opportunities = opportunities.concat(result.opportunities)
      endpoint = endpointRoot +
        '&startAfterId=' + result.meta.startAfterId + 
        '&startAfter=' + result.meta.startAfter
    } while (result.meta.nextPageUrl)
    return opportunities
  }

  ns.getOpportunity = function(pipelineId, opportunityId) {
    return callHighLevel('get', 'pipelines/' + pipelineId + '/opportunities/' + opportunityId)
  }

  ns.getPipelines = function() {
    return callHighLevel('get', 'pipelines/')
  }

  ns.getContact = function(id) {
    return callHighLevel('get', 'contacts/'+id)
  } 

  ns.getCustomValues = function() {
    return callHighLevel('get', 'custom-values/')
  }

  ns.createCustomValue = function(valueName, value) {
    return callHighLevel(
      'post',
      'custom-values/',
      {
        'name': valueName,
        'value': value
      }
    )
  }

  ns.updateCustomValue = function(customValueId, valueName, value) {
    return callHighLevel(
      'put',
      'custom-values/' + customValueId,
      {
        'name': valueName,
        'value': value
      }
    )
  }

  /**
   * @param {Object[]} customValues Array of objects of form {name: 'string', value: 'string'}
   */
  ns.setCustomValues = function(customValues) {
    var existingCustomValues = ns.getCustomValues().customValues
    customValues.forEach(function(customValue){
      var existing = existingCustomValues.find(function(x){return x.name === customValue.name})
      if (existing) {
        var updatedCustomValue = ns.updateCustomValue(existing.id, customValue.name, customValue.value)
        console.log("Updated custom value: %s", JSON.stringify(updatedCustomValue))
      } else {
        console.warn("Couldn't find custom value called %s.", customValue.name)
        var newCustomValue = ns.createCustomValue(customValue.name, customValue.value)
        console.log("Created new custom value: %s", JSON.stringify(newCustomValue))
      }

    })
    
  }


  return ns;

  // -----------------
  // Private functions

  /**
   * Make a call to the Dialpad API
   * @param {string} method GET, PUT, POST, DELETE
   * @param {string} endpoint 
   * @param {Object} payload 
   * @returns {Object} The API response.
   */
  function callHighLevel(method, endpoint, payload){
    if (!HIGHLEVEL_API_KEY) throw new Error("No API key specified")

    var root = 'https://rest.gohighlevel.com/v1/';
    
    var params = {
      'method': method,
      'headers': {
        'Authorization': 'Bearer ' + HIGHLEVEL_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    if (DEBUG) params.muteHttpExceptions = true;
    if (payload) params.payload = JSON.stringify(payload)
    
    var response = DEBUG ? 
      UrlFetchApp.fetch(root + endpoint, params) :
      FetchTools.backoffOne(root + endpoint, params);
    var content = response.getContentText();
    // Some endpoints return empty response.
    if (!content) return null;
    if (DEBUG) console.log(content)
    var json = JSON.parse(content);
    return json;
  }

})({})

/**
 * Utilities for interfacing with HighLevel API as an agency
 * http://developers.gohighlevel.com/
 */
var HighLevelAgency = (function(ns) {
  var AGENCY_API_KEY = PropertiesService.getScriptProperties().getProperty('high_level_agency_key')

  ns.getUsers = function() {
    return callHighLevel('get','users/')
  }

  ns.getLocations = function() {
    return callHighLevel('get', 'locations/')
  }

  ns.getLocation = function(locationId) {
    return callHighLevel('get', 'locations/' + locationId)
  }

  ns.setTwilioAuth = function(locationId, sid, token) {
    return callHighLevel(
      'put', 
      'locations/' + locationId,
      {
        'twilio': {"sid": sid, "authToken": token}
      }
    )
  }

  ns.removeTwilioAuth = function(locationId) {
    return callHighLevel('delete', 'locations/' + locationId + '/twilio')
  }

  return ns;

  // -----------------
  // Private functions

  /**
   * Make a call to the High Level API
   * @param {string} method GET, PUT, POST, DELETE
   * @param {string} endpoint 
   * @param {Object} payload 
   * @returns {Object} The API response.
   */
  function callHighLevel(method, endpoint, payload){
    if (!AGENCY_API_KEY) throw new Error("No API key specified")

    var root = 'https://rest.gohighlevel.com/v1/';
    
    var params = {
      'method': method,
      'headers': {
        'Authorization': 'Bearer ' + AGENCY_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (payload) params.payload = JSON.stringify(payload)
    if (DEBUG) {
      params.muteHttpExceptions = true;
      console.log("Sending request to %s with these params:\n %s", root + endpoint, JSON.stringify(params, null, 2))
    }
    
    var response = DEBUG ? 
      UrlFetchApp.fetch(root + endpoint, params) :
      FetchTools.backoffOne(root + endpoint, params);
    var content = response.getContentText();
    // Some endpoints return empty response.
    if (!content) {
      if (DEBUG) console.log("Null response received")
      return null
    };

    var json = JSON.parse(content);
    if (DEBUG) console.log("Response is %s", JSON.stringify(json, null, 2))
    return json;
  }

})({})

