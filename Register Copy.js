/**
 * Server function: add details to the row for a registered copy
 * (registration happens when we run the setup on the copy)
 * This can happen from gym owner editable copy, or from crm dashboard copy, so route to the proper function
 * @param {Object} config 
 */
function registerCopy(config) {
  // Route depending whether this is the crm dashboard copy, or the gym-owner editable copy.
  if (config.role === 'editor') {
    return registerEditableCopy(config)
  } else {
    return registerDashboardCopy(config)
  }
}

/**
 * Add details to the row for a registered copy of the dashboard
 * (registration happens when we run the setup on the copy)
 * @param {Object} config 
 */
function registerDashboardCopy(config) {
  // Specify registration info to add to row

  var registrationInfo = {
    // Include spreadsheet id and url in case this is an older copy registering with our new system.
    'spreadsheetId': config.fileId,
    'crmSpreadsheetLink': SpreadsheetApp.openById(config.fileId).getUrl(),
    'scriptId': config.scriptId,
    'ranSetup': new Date(),
    'setupEmail': config.user,
    'deployedUrl': deployWebApp(config.scriptId),
    'webhookApiKey': config.apiKey,
  }

  var sheet = SS.getSheetByName('CRM Copies')
  var copies = getRowsData(sheet, null, {getMetadata: true})
  var existingCopy = copies.find(function(copy){return copy.spreadsheetId === config.fileId})
  if (existingCopy) {
    Object.assign(existingCopy, registrationInfo)
    setRowsData(
      sheet, 
      [existingCopy],
      {
        firstRowIndex: existingCopy.sheetRow,
        log: true,
        preserveArrayFormulas: true
      }
    )

    // Add the web app url to the gym owner copy's "Protected" sheet (needs to be done during the dashboard setup, not the editable setup, b/c this is when we deploy)
    var gymOwnerSpreadsheet = SpreadsheetApp.openById(existingCopy.sharedSpreadsheetId)
    var protectedSheet = gymOwnerSpreadsheet.getSheetByName("Protected")
    var webAppUrlRange = getRangeByName(protectedSheet, "WebAppUrl") || protectedSheet.getRange("B3")
    webAppUrlRange.setValue(registrationInfo.deployedUrl)
    console.log("Set web app url on gym owner's copy")
    
    // Update HL Custom Values: they will be created if they don't already exist
    var customValues = [
      {'name': 'Sheets Webhook URL', 'value': existingCopy.deployedUrl + "?apiKey=" + existingCopy.webhookApiKey}
      // TODO: Once we update data studio to html, add links to dashboard and detailed metrics
    ]
    if (existingCopy.highlevelApiKey) {
      HighLevelLocation.setApiKey(existingCopy.highlevelApiKey).setCustomValues(customValues)
    } else {
      console.warn("No HL API Key found for gym %s", existingCopy.gymName)
    }

  } else {
    console.warn("CRM copy with id %s not found on admin panel", config.fileId)
    setRowsData(
      sheet,
      [registrationInfo],
      {
        writeMethod: 'append',
        log: true,
        preserveArrayFormulas: true
      }
    )
  }

  return {
    status: 'success',
    message: 'Registered and deployed with URL ' + registrationInfo.deployedUrl
  }

}

/**
 * Add details to the row for a registered copy of the gym-owner-editable
  * @param {Object} config 
 */
function registerEditableCopy(config) {
  // Specify registration info to add to row 

  var registrationInfo = {
    'sharedSpreadsheetId': config.fileId,
    'sharedSpreadsheetLink': SpreadsheetApp.openById(config.fileId).getUrl(),
    'sharedScriptId': config.scriptId,
    'sharedRanSetup': new Date(),
    'sharedSetupEmail': config.user,
    'pricingLink': config.pricingLink,
    'accountabilityLink': config.accountabilityLink,
    'settingsLink': config.settingsLink,
    'commissionsLink': config.commissionsLink
  }

  // Update in admin panel
  var sheet = SS.getSheetByName('CRM Copies')
  var copies = getRowsData(sheet, null, {getMetadata: true})
  var existingCopy = copies.find(function(copy){return copy.sharedSpreadsheetId === config.fileId})
  if (existingCopy) {
    Object.assign(existingCopy, registrationInfo)
    setRowsData(
      sheet, 
      [existingCopy],
      {
        firstRowIndex: existingCopy.sheetRow,
        log: true,
        preserveArrayFormulas: true
      }
    )

    // Update HL Custom Values: they will be created if they don't already exist
    var customValues = [
      {'name': 'Accountability Tracking Link', 'value': existingCopy.accountabilityLink},
      {'name': 'Customer Pricing Link', 'value': existingCopy.pricingLink},
      {'name': 'Gym Settings Link', 'value': existingCopy.settingsLink},
      {'name': 'Commissions Link', 'value': existingCopy.commissionsLink},
      // TODO: Once we update data studio to html, add links to dashboard and detailed metrics
    ]
    if (existingCopy.highlevelApiKey) {
      HighLevelLocation.setApiKey(existingCopy.highlevelApiKey).setCustomValues(customValues)
    } else {
      console.warn("No HL API Key found for gym %s", existingCopy.gymName)
    }
    

  } else {
    console.warn("Shared copy with id %s not found on admin panel", config.fileId)
    setRowsData(
      sheet,
      [registrationInfo],
      {
        writeMethod: 'append',
        log: true,
        preserveArrayFormulas: true
      }
    )
  }


  return {
    status: 'success',
    message: 'Registered shared copy'
  }

}
