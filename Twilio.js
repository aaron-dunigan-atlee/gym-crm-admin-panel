/**
 * Server function: add Twilio auth to location
 * This action is called from the gym-owner copy only.
 * @param {Object} config 
 */
function setTwilioAuth(config) {
  // Use the SSID to look up the HL Location ID
  var gym = getRowsData(SS.getSheetByName('CRM Copies')).find(function(g){return g.sharedSpreadsheetId === config.fileId})
  if (!gym) throw new Error("Can't find corresponding gym")
  console.log("Request to set Twilio auth for %s, location ID %s", gym.gymName, gym.highlevelLocationId)

  // Send the request to HL
  var result = HighLevelAgency.setTwilioAuth(gym.highlevelLocationId, config.sid, config.token)
  console.log(result)

  // Return success message
  return {
    status: 'success',
    message: 'Twilio SID and token were set.'
  }

}

/**
 * Server function: remove Twilio auth from location
 * This action is called from the gym-owner copy only.
 * @param {Object} config 
 */
 function removeTwilioAuth(config) {
  // Use the SSID to look up the HL Location ID
  var gym = getRowsData(SS.getSheetByName('CRM Copies')).find(function(g){return g.sharedSpreadsheetId === config.fileId})
  if (!gym) throw new Error("Can't find corresponding gym")
  console.log("Request to set Twilio auth for %s, location ID %s", gym.gymName, gym.highlevelLocationId)

  // Send the request to HL
  HighLevelAgency.removeTwilioAuth(gym.highlevelLocationId)

  // Return success message
  return {
    status: 'success',
    message: 'Twilio SID and token were removed.'
  }

}