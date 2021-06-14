/**
 * Make a new copy of the crm for a gym owner
 * @param {Object} config From sidebar
 */
function makeNewCopy(config) {
  console.log("Creating new crm copy for this config: %s", JSON.stringify(config))

  // Make a copy 
  var crmCopy = SpreadsheetApp.openById(CRM_TEMPLATE_ID).copy("CRM & KPI Dashboard - " + config.gymName)
  var gymOwnersFolder = DriveApp.getFolderById(GYM_OWNER_FOLDER_ID);
  DriveApp.getFileById(crmCopy.getId()).moveTo(gymOwnersFolder)
  console.log("New CRM copy has id %s", crmCopy.getId())

  // Clear test data
  clearTestData(crmCopy)
  console.log("Cleared test data")

  // Record metadata
  config.spreadsheetId = crmCopy.getId()
  config.crmSpreadsheetLink = crmCopy.getUrl()
  config.created = new Date()
  config.settingsLink = "RUN SETUP"
  config.accountabilityLink = "RUN SETUP"
  config.pricingLink = "RUN SETUP"
  config.commissionsLink = "RUN SETUP"
  
  // Generate the spreadsheet we will share with gym owner, with editable client details (challenge and membership pricing)
  var gymOwnerCopy = createGymOwnerCopy(crmCopy, gymOwnersFolder, config)
  // Record info
  config.sharedSpreadsheetLink = gymOwnerCopy.getUrl();
  var gymOwnerCopyId = gymOwnerCopy.getId();
  config.sharedSpreadsheetId = gymOwnerCopyId
  // Share with gym owner
  shareSilentlyFailSilently(config.sharedSpreadsheetId, config.email, 'writer')
  console.log("Created and shared gym owner's copy")

  // Get the HighLevel Api Key and set it on the crm
  config.highlevelApiKey = HighLevelAgency.getLocation(config.highlevelLocationId).apiKey
  var apiKeyRange = getRangeByName(crmCopy.getSheetByName("DO NOT MODIFY"), 'HighLevelApiKey')
  apiKeyRange.setValue(config.highlevelApiKey)
  console.log("Set HL API key in crm spreadsheet")
  

  // Enable the IMPORTRANGE access: there are multiple importrange instances, but we only need to authorize one of them on each spreadsheet
  // This doesn't seem to work permanently
  // allowAccessImportRange(crmCopy.getSheetByName(SETTINGS_SHEET_NAME).getRange('A1'), gymOwnerCopyId)
  // allowAccessImportRange(gymOwnerCopy.getSheetByName('Pricing').getRange('A1'), crmCopy.getId())
  // console.log("Enabled importrange")

  // TODO: Run the Setup automatically so we can get script id's from both spreadsheets.  So far I can't find any way to automate this b/c we won't know the script id yet.

  // Write metadata to sheet
  setRowsData(
    SS.getSheetByName('CRM Copies'),
    [config],
    {
      writeMethod: 'append',
      log: true
    }
  )
  console.log("Recorded data to admin panel")

  // Return message to sidebar
  return {
    'type': 'success',
    'message': 'New CRM created'
  }
}

/**
 * Create the gym-owner-facing editable spreadsheet 
 * @param {SpreadsheetApp.Spreadsheet} crmSpreadsheet 
 * @returns {SpreadsheetApp.Spreadsheet}
 */
function createGymOwnerCopy(crmSpreadsheet, destination, config) {
  // Copy the template: sheet protections should come along for the ride (we want sheet "Protected" to be protected.)
  var gymOwnerCopy = SpreadsheetApp.openById(GYM_OWNER_TEMPLATE_ID).copy("Accountability and Pricing - " + config.gymName)
  DriveApp.getFileById(gymOwnerCopy.getId()).moveTo(destination)

  // Update importrange formulas by udpating the named ranges that store the id's:
  crmSpreadsheet.getRangeByName('LinkedSpreadsheetId').setValue(gymOwnerCopy.getId())
  gymOwnerCopy.getRangeByName('CrmSpreadsheetId').setValue(config.spreadsheetId)

  // Set gym name
  if (config.gymName) {
    var gymNameRange = getRangeByName(gymOwnerCopy.getSheetByName('Settings'), 'GymName')
    if (gymNameRange) gymNameRange.setValue(config.gymName)
  }

  // Clear test data
  clearTestData(gymOwnerCopy)

  return gymOwnerCopy
}


/**
 * Opens a sidebar for adding a new client
 */
function showCreateCopySidebar() {

  var template = HtmlService.createTemplateFromFile('new-copy/sidebar');
  var ui = template.evaluate().setTitle('New CRM Copy');  
  SpreadsheetApp.getUi().showSidebar(ui);
}

/**
 * Since we use the templates for testing, there may be test data in them when copied over.  Remove it.
 * But leave one row of data, because we need this for Google Data Studio to process the new data source.
 * @param {Spreadsheet} spreadsheet May be the gym owner editable or the dashboard crm
 */
function clearTestData(spreadsheet) {
  var accountabilitySheet = spreadsheet.getSheetByName(ACCOUNTABILITY_SHEET_NAME)
  if (accountabilitySheet && accountabilitySheet.getLastRow() > ACCOUNTABILITY_HEADERS_ROW + 1) {
    // There's a row between the headers and start of data, so first data row is HEADERS + 1 (for 1-index) + 1 (for extra row) + 1 (to get to next row)
    accountabilitySheet.getRange(ACCOUNTABILITY_START_ROW, 1, accountabilitySheet.getLastRow() - ACCOUNTABILITY_START_ROW + 1, accountabilitySheet.getLastColumn())
      .clearContent();
  }

  var crmSheet = spreadsheet.getSheetByName(CRM_SHEET_NAME) || spreadsheet.getSheetByName('Pricing')
  if (crmSheet && crmSheet.getLastRow() > CRM_HEADERS_ROW + 1) {
    crmSheet.getRange(CRM_HEADERS_ROW + 2, 1, crmSheet.getLastRow() - CRM_HEADERS_ROW - 1, crmSheet.getLastColumn())
      .clearContent();
  }    
}