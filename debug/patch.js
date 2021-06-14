/**
 * 5.25.21 Add salesperson dropdown and conditional formats
 */
 function patch_fixValidation() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy,
  gyms = gyms.slice(0,1)

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){patch_updateForFixValidation(gym)})
}

function patch_updateForFixValidation(gym) {
  console.log("Updating %s", gym.gymName)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Apparently we have to remove the filter before applying data validation
  var pricingSheet = gymOwnerSpreadsheet.getSheetByName('Pricing')

  // Remove the existing filter. We just need any range on the sheet to get the sheet's filter.
  var existingFilter = pricingSheet.getRange("A1").getFilter()
  if (existingFilter) existingFilter.remove();
  SpreadsheetApp.flush()

  // Create the validation rule
  rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(pricingSheet.getRange('SalespersonNames'))
    .setAllowInvalid(true)
    .build();
  pricingSheet.getRange("G2:G").setDataValidation(rule);
  console.log("Added salesperson dropdown")

  // Create a new filter that covers the whole data
  var filter = pricingSheet.getRange(1, 1, pricingSheet.getMaxRows(), pricingSheet.getMaxColumns()).createFilter()
  var criteria = SpreadsheetApp.newFilterCriteria()
    // There's a .setVisibleValues() which would be more convenient, except it's not supported.  Oh, google. 
    .setHiddenValues([
      '',
      null,
      'New Lead',
      'Not a Good Fit',
      'Show, No-Close',
      'No-Show',
      'Scheduled Appointments',
      'Archived',
      'Cancelled Membership'
    ])
    .build()
  // Column 1 is client status
  filter.setColumnFilterCriteria(1, criteria)

  console.log("Updated pricing filter to cover range %s", filter.getRange().getA1Notation())
}


/**
 * 5.21.21 Update formula for front end revenue
 */
 function patch_FrontEndRevenue() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy,
  gyms = gyms.slice(0, 1)

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForFrontEndRevenue)
}

function patch_updateForFrontEndRevenue(gym) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)

   // Make changes  on  CRM
   var crmSheet = crmSpreadsheet.getSheetByName(CRM_SHEET_NAME)
   crmSheet.getRange("AD1").setFormula('={"Front-end Revenue";ARRAYFORMULA(IFERROR(IF(ISBLANK($A$2:$A),"",IF(REGEXMATCH(UPPER($A$2:$A), "CHALLENGE"), $D$2:D,IF(REGEXMATCH(UPPER($A$2:$A), "MEMBER"), $G$2:$G + $D$2:$D,0)))))}')

   console.log("Updated formula")
   crmSheet.getRange("F1:F").setNumberFormat('@STRING@')
   console.log("Updated format")

}

/**
 * 5.19.21 Add twilio sid and token to settings
 */
 function patch_Twilio() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy,
  gyms = gyms.slice(0, 1)

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForTwilio)
}

function patch_updateForTwilio(gym) {
  console.log("Updating %s", gym.gymName)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

   // Make changes  on gym owner's settings sheet
   var settingsSheet = gymOwnerSpreadsheet.getSheetByName("Settings")
   settingsSheet.getRange("B9:C11").copyFormatToRange(settingsSheet, 2, 3, 17, 19)
   settingsSheet.getRange("B17:C19").setValues([
     ['Twilio',''],
     ['Twilio SID', ''],
     ['Twilio token', '']
   ])
   settingsSheet.getRange("C18:C19").setNumberFormat('@STRING@')
   gymOwnerSpreadsheet.setNamedRange('TwilioSID', settingsSheet.getRange("C18"))
   gymOwnerSpreadsheet.setNamedRange('TwilioToken', settingsSheet.getRange("C19"))
   console.log("Updated settings sheet")

}

/**
 * 5.11.21 Protect commissions page to dumb-proof it.
 */
 function patch_protectCommissions() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy,
  gyms = gyms.slice(0, 1)

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForProtectCommissions)
}

function patch_updateForProtectCommissions(gym) {
  console.log("Updating %s", gym.gymName)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Update conditional formatting to dumb-proof the membership pricing
  var commissionsSheet = gymOwnerSpreadsheet.getSheetByName('Commissions')

  var protection = commissionsSheet.protect()
    .setWarningOnly(false)
  var editors = protection.getEditors().filter(function(ed){return ed.getEmail() !== 'chatbot@maxoutyourgym.com'})
  if (editors.length > 0) {
    protection.removeEditors(editors)
    console.log('Removed %s editors', editors.length)
  }

  console.log("Set protections")

}

/**
 * 5.10.21 Add salesperson dropdown and conditional formats
 */
 function patch_pricingFormatAndValidation() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy,
  gyms = gyms.slice(1)

  var templateSalespersonNames = SpreadsheetApp.openById(GYM_OWNER_TEMPLATE_ID).getSheetByName('Settings').getRange('F14:H26')

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){patch_updateForPricingFormatAndValidation(gym, templateSalespersonNames)})
}

function patch_updateForPricingFormatAndValidation(gym, templateSalespersonNames) {
  console.log("Updating %s", gym.gymName)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Update conditional formatting to dumb-proof the membership pricing
  var pricingSheet = gymOwnerSpreadsheet.getSheetByName('Pricing')
  var rules = pricingSheet.getConditionalFormatRules()
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .setRanges([pricingSheet.getRange("E2:F")])
      .whenFormulaSatisfied('=AND($A2<>"Member Sign-Up",$A2<>"Cancelled Membership", NOT(ISBLANK(E2)))')
      .setBackground('#ea9999') // light red 2
      .build()
  )
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .setRanges([pricingSheet.getRange("D2:D")])
      .whenFormulaSatisfied('=AND($A2<>"Challenge Sign-Up",$A2<>"Member Sign-Up",$A2<>"Cancelled Membership", NOT(ISBLANK(D2)))')
      .setBackground('#ea9999') // light red 2
      .build()
  )
  pricingSheet.setConditionalFormatRules(rules)
  console.log("Set conditional formatting")

  // Update data validation
  var rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=IF(AND($A2<>"Challenge Sign-Up",$A2<>"Member Sign-Up",$A2<>"Cancelled Membership"), ISBLANK(D2), TRUE)')
    .setAllowInvalid(false)
    .setHelpText('You can only enter challenge details for challengers')
    .build();
  pricingSheet.getRange("D2:D").setDataValidation(rule);

  rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=IF(AND($A2<>"Member Sign-Up",$A2<>"Cancelled Membership"), ISBLANK(F2), TRUE)')
    .setAllowInvalid(false)
    .setHelpText('You can only enter membership details for members')
    .build();
  pricingSheet.getRange("F2:F").setDataValidation(rule);
  console.log("Set data validation")

  // Add salesperson dropdown
  var settingsSheet = gymOwnerSpreadsheet.getSheetByName("Settings")
  settingsSheet.insertRowsAfter(16, 11)
  var namesRange = 
  settingsSheet.getRange('F14:H26')
    .mergeAcross()
    .setValues(templateSalespersonNames.getValues())
    .setBackgrounds(templateSalespersonNames.getBackgrounds())
    .setBorder(true, true, true, true, true, true)
    .setFontSizes(templateSalespersonNames.getFontSizes())
    .setFontWeights(templateSalespersonNames.getFontWeights())
    .setFontColors(templateSalespersonNames.getFontColors())
    .setHorizontalAlignment("center")
  SpreadsheetApp.flush()

  gymOwnerSpreadsheet.setNamedRange('SalespersonNames', settingsSheet.getRange('F15:H26'))
  SpreadsheetApp.flush()

  rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(pricingSheet.getRange('SalespersonNames'))
    .setAllowInvalid(true)
    .build();
  pricingSheet.getRange("G2:G").setDataValidation(rule);
  console.log("Added salesperson names")

}

/**
 * 5.5.21 Update formula for LTV
 */
 function patch_ltvFormula() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy, 
  gyms = gyms.slice(0, 1)

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){
    console.log("Updating %s", gym.gymName)
    var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
    crmSpreadsheet.getSheetByName("CRM Tracking Sheet").getRange("AO1").setFormula(
      '={"Lifetime Value";ARRAYFORMULA(IFERROR(IF((A2:A="Challenge Sign-Up")+(A2:A="Member Sign-Up")+(A2:A="Cancelled Membership"),D2:D + G2:G * AH2:AH,)))}'
    )
    console.log("Updated formula")
  })
}

/**
 * Add commissions link on High Level
 * 5.5.21
 */
function patch_commissionsLink() {
  var adminPanel = SS.getSheetByName('CRM Copies')   
  var gyms = getRowsData(adminPanel)

  console.log("Updating %s gyms", gyms.length)
  gyms.slice(0, 1).forEach(function(gym){
    console.log("Updating %s", gym.gymName)
    var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)
    var targetSheet = gymOwnerSpreadsheet.getSheetByName('Commissions')
    gym.commissionsLink = getSheetUrl(targetSheet, {'noTools': true});
    console.log("Commissions Link is %s", gym.commissionsLink)
    // Update HL Custom Values: they will be created if they don't already exist
    var customValues = [
      {'name': 'Commissions Link', 'value': gym.commissionsLink},
    ]
    if (gym.highlevelApiKey) {
      HighLevelLocation.setApiKey(gym.highlevelApiKey).setCustomValues(customValues)
    } else {
      console.warn("No HL API Key found for gym %s", existingCopy.gymName)
    }
    console.log("Added link to high level")
  })

  // Write back commissions links to admin panel
  setRowsData(
    adminPanel,
    gyms,
    {
      startHeader: "Commissions Link",
      endHeader: "Commissions Link",
      log: true
    }
  )

}


/**
 * 5.5.21 Add protections and coloring so gym owners can't screw up the pricing page
 */
function patch_pricingProtections() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy, 
  gyms = gyms.slice(0, 1)

  var sourceSheet = SpreadsheetApp.openById(GYM_OWNER_TEMPLATE_ID).getSheetByName('Pricing')
  var headerBackgrounds = sourceSheet.getRange("1:1").getBackgrounds()

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){
    console.log("Updating %s", gym.gymName)
    var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)
    var targetSheet = gymOwnerSpreadsheet.getSheetByName('Pricing')
    duplicateSheetProtections(sourceSheet, targetSheet)
    console.log("Updated protections")
    targetSheet.getRange(1,1,headerBackgrounds.length, headerBackgrounds[0].length).setBackgrounds(headerBackgrounds)
    console.log("Updated background colors")
  })
}

/**
 * 4.29.21 Patch on the other patch
 */
 function patch_adjustSettings() {
  
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy, already updated
  // var moygTemplate = gyms.shift()
  // patch_updateForSettings(moygTemplate)
  // return
  // Start with Ballymena
  for(var i=0; i<9; i++) {
    gyms.shift()
  }

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){patch_updateForSettings(gym)})
}

function patch_updateForSettings(gym) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

   // Make changes  on gym owner's settings sheet
   var settingsSheet = gymOwnerSpreadsheet.getSheetByName("Settings")
   var yellowRanges = ['C2:G2']
   yellowRanges.forEach(function(range){
     settingsSheet.getRange(range).setBackground(null)
   })

  // Make changes  on crm settings sheet
  var settingsSheet = crmSpreadsheet.getSheetByName("Settings")
  var formulaCell = settingsSheet.getRange("A1")
  var formula = formulaCell.getFormula()
  formulaCell.clearContent()
  SpreadsheetApp.flush()
  var yellowRanges = ['C5:D7','G5:G6','C12:C14','G14:G16','C2:G2']
  yellowRanges.forEach(function(range){
    settingsSheet.getRange(range).setBackground(null)
  })
  settingsSheet.getRange("F11:H12").deleteCells(SpreadsheetApp.Dimension.ROWS)
  settingsSheet.deleteRows(9,2)
  SpreadsheetApp.flush()
  settingsSheet.getRange('B9:C10').copyFormatToRange(settingsSheet, 2,3,14,15)
  crmSpreadsheet.setNamedRange('SalesCommissionRate',settingsSheet.getRange('C15'))
  settingsSheet.deleteRows(17,3)
  formulaCell.setFormula(formula)
  SpreadsheetApp.flush()
  console.log("Updated settings sheet")

}


/**
 * 4.29.21 Add columns to calculate sales commissions
 */
function patch_addLifetimeValue() {
  var commissionsSheet = SpreadsheetApp.openById(GYM_OWNER_TEMPLATE_ID).getSheetByName('Commissions')
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The first one is our test copy, already updated
  var moygTemplate = gyms.shift()

  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(function(gym){patch_updateForLifetimeValue(gym, commissionsSheet)})
}

function patch_updateForLifetimeValue(gym, commissionsSheet) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Fix conditional formatting
  var pricingSheet = gymOwnerSpreadsheet.getSheetByName('Pricing')
  var rules = pricingSheet.getConditionalFormatRules()
  var newRules = []
  rules.forEach(function(rule){
    if (rule.getRanges().some(function(range){return range.getA1Notation().startsWith('F2')})) {
      newRules.push(rule.copy().setRanges([pricingSheet.getRange("F2:F")]).build())
    } else {
      newRules.push(rule)
    }
  })
  pricingSheet.setConditionalFormatRules(newRules)

  // Make changes  on gym owner's settings sheet
  var settingsSheet = gymOwnerSpreadsheet.getSheetByName("Settings")
  var yellowRanges = ['C5:D7','G5:G6','C12:C14','G14:G16']
  yellowRanges.forEach(function(range){
    settingsSheet.getRange(range).setBackground(null)
  })
  settingsSheet.getRange("F11:H12").deleteCells(SpreadsheetApp.Dimension.ROWS)
  settingsSheet.deleteRows(9,2)
  SpreadsheetApp.flush()
  settingsSheet.getRange('B9:C10').copyFormatToRange(settingsSheet, 2,3,14,15)
  settingsSheet.getRange('B14:C15').setValues([['Sales Commissions',''],['Commission rate', '10%']])
  gymOwnerSpreadsheet.setNamedRange('SalesCommissionRate',settingsSheet.getRange('C15'))
  settingsSheet.deleteRows(17,3)
  SpreadsheetApp.flush()
  console.log("Updated gym owner settings sheet")

  // Add commissions sheet
  var newCommissions = commissionsSheet.copyTo(gymOwnerSpreadsheet).setName('Commissions')
  var formulas = commissionsSheet.getDataRange().getFormulas()
  newCommissions.getRange(1,1,formulas.length,formulas[0].length).setFormulas(formulas)
  console.log("Added commissions sheet")

  // On crm spreadsheet: add new columns
  var crmSheet = crmSpreadsheet.getSheetByName("CRM Tracking Sheet")
  crmSheet.insertColumnsAfter(39, 2) // After AM
  crmSheet.getRange("AL:AL").copyFormatToRange(crmSheet, 41, 41, 1, crmSheet.getMaxRows())
  crmSheet.getRange("AN1:AO1").setValues([[
    '={"Membership Length (Months)";ARRAYFORMULA(IFERROR(IFS((A2:A="Challenge Sign-Up")*(NOT(ISBLANK(AC2:AC))), DATEDIF(AC2:AC, TODAY(), "M" ), A2:A="Cancelled Membership", DATEDIF(AC2:AC, AJ2:AJ, "M" ), TRUE, )))}',
    '={"Lifetime Value";ARRAYFORMULA(IFERROR(IF((A2:A="Challenge Sign-Up")+(A2:A="Member Sign-Up")+(A2:A="Cancelled Membership"),D2:D + G2:G * AN2:AN,)))}'
  ]])
  console.log("Updated crm sheet")


}

/**
 * 4.27.21 Add columns to calculate sales commissions
 */
function patch_addCommission() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The last one is the sandbox; it's already updated
  var sandbox = gyms.pop()
  
  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForCommissions)
}

function patch_updateForCommissions(gym) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Insert columns and add formulas/headers  on gym owner's sheet
  var pricingSheet = gymOwnerSpreadsheet.getSheetByName("Pricing")
  pricingSheet.insertColumnsAfter(6,3) // After F
  pricingSheet.getRange("B:B").copyFormatToRange(pricingSheet, 7, 9, 1, pricingSheet.getMaxRows())
  pricingSheet.getRange("G1:H1").setValues([[
    "Salesperson",
    '=IMPORTRANGE(CrmSpreadsheetId,"\'CRM Tracking Sheet\'!AK:AL")'
  ]])
  console.log("Updated gym owner pricing sheet")

  // On crm spreadsheet: update importrange, and show/hide appropriate columns on Acc. tracking
  var crmSheet = crmSpreadsheet.getSheetByName("CRM Tracking Sheet")

  crmSheet.insertColumnsAfter(35, 4) // After AI
  crmSheet.getRange("AI:AI").copyFormatToRange(crmSheet, 36, 39, 1, crmSheet.getMaxRows())
  crmSheet.getRange("AJ1:AM1").setValues([[
    'Membership End Date',
    '={"Revenue This Month"; ARRAYFORMULA(IFERROR(IFS(($A2:$A = "Challenge Sign-Up") * (YEAR($X2:$X)=YEAR(TODAY())) * (MONTH($X2:$X)=MONTH(TODAY())) , $D2:$D, ($A2:$A = "Member Sign-Up") * (1-((YEAR($AJ2:$AJ)=YEAR(TODAY())) * (MONTH($AJ2:$AJ)=MONTH(TODAY())))), $G2:$G,TRUE, )))}',
    '={"Revenue Last Month";ARRAYFORMULA(IFERROR(IFS(($A2:$A = "Challenge Sign-Up") * (YEAR($X2:$X)=YEAR(EDATE(TODAY(),-1))) * (MONTH($X2:$X)=MONTH(EDATE(TODAY(),-1))) , $D2:$D,($A2:$A = "Member Sign-Up") * ($AC2:AC < DATE(YEAR(TODAY()),MONTH(TODAY()),1)), $G2:$G,($A2:$A = "Cancelled Membership") * ($AC2:AC < DATE(YEAR(TODAY()),MONTH(TODAY()),1)) * (YEAR($AJ2:AJ)=YEAR(TODAY())) * (MONTH($AJ2:$AJ) = MONTH(TODAY())) , $G2:$G,TRUE, )))}',
    '=ARRAYFORMULA(IMPORTRANGE(LinkedSpreadsheetId,"\'Pricing\'!G:G"))'
  ]])
  console.log("Updated crm sheet")

  var referenceSheet = crmSpreadsheet.getSheetByName('DO NOT MODIFY')
  referenceSheet.getRange("H10").setValue('Cancelled Membership')
  console.log("Updated reference sheet")

}

/**
 * Get the challenger spreadsheet in the given folder with the given name, or if it doesn't exist, create it
 * @param {Folder} folder 
 * @param {string} filename 
 * @param {Date} startDate
 */
 function patch_getChallengerSpreadsheet(folder, filename, startDate) {
  startDate = startDate || new Date()
  folder = folder || getLocationFolder()

  var file = getFileByName(folder, filename)
  if (file) return SpreadsheetApp.open(file)

  // Doesn't exist; create it from a template
  file = DriveApp.getFileById(CHALLENGE_TRACKER_TEMPLATE_ID).makeCopy(filename, folder)
  console.log("Created challenge tracker %s with id %s", filename, file.getId())
  spreadsheet = SpreadsheetApp.open(file)
  // Create check-in rows for the challenge trackers
  var checkins = []
  var challengeLength = getChallengeLength()
  for (var i=1; i<=challengeLength; i++) {
    checkins.push({
      'checkin': 'Check-in #' + i,
      'date': getDatestamp(startDate)
    })
    startDate.setDate(startDate.getDate()+7)
  }
  setRowsData(
    spreadsheet.getSheetByName('Check-ins'),
    checkins,
    {
      log: true,
      startHeader: 'Check-in',
      endHeader: 'Date'
    }
  )
  return spreadsheet

}


/**
 * Patch 4.19.21 to push out spreadsheet changes so we can produce challenger files
 */
 function patch_challengerFiles() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies'))
  // The last one is the sandbox; it's already updated
  gyms.pop()
  
  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForChallengerFiles)
}

function patch_updateForChallengerFiles(gym) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)

  // Insert column and add header (with merged cells) on gym owner's accountability sheet
  var accountabilitySheet = gymOwnerSpreadsheet.getSheetByName("Accountability Tracking")
  accountabilitySheet.insertColumnAfter(35) // After AI
  accountabilitySheet.getRange("AJ5:AJ7").merge().setVerticalAlignment('middle').setValue("Challenger File")
  console.log("Updated gym owner acc. sheet")

  // On crm spreadsheet: update importrange, and show/hide appropriate columns on Acc. tracking
  var crmAccountabilitySheet = crmSpreadsheet.getSheetByName("Accountability Tracking")
  var formulaRange = crmAccountabilitySheet.getRange("A1")
  var formula = formulaRange.getFormula().replace("A:AJ", "A:AK")
  formulaRange.setFormula(formula)
  SpreadsheetApp.flush()

  crmAccountabilitySheet.showColumns(36) // Show the Challenger File column
  crmAccountabilitySheet.hideColumns(37, crmAccountabilitySheet.getMaxColumns() - 37 + 1)
  crmAccountabilitySheet.getRange("AJ5:AJ7").merge().setVerticalAlignment('middle')
  console.log("Updated crm acc. sheet")

}

function patch_splitArrayFormula() {
  var adminSheet = SS.getSheetByName('CRM Copies')
  var gyms = getRowsData(adminSheet)
  gyms.forEach(function(gym){
    var crm = SpreadsheetApp.openById(gym.spreadsheetId)
    var crmSheet = crm.getSheetByName(CRM_SHEET_NAME)
    
    
    var formulaRange = crmSheet.getRange("F1")
    var formula = formulaRange.getFormula()
    if (formula !== '=ARRAYFORMULA(IMPORTRANGE(LinkedSpreadsheetId,"\'Pricing\'!E:F"))') {
      console.warn("Gym %s doesn't have correct formula!", gym.gymName)
      return;
    }
    formulaRange.setFormula(formula.replace('E:F','E:E'))
    formulaRange.offset(0,1,1,1).setFormula(formula.replace('E:F','F:F'))
    console.log("Set formula for %s", gym.gymName)
  })

}

/**
 * Patch 3.25.21 to update existing spreadsheets with their HL API Key
 */
function patch_setHlApiKeyOnCrms() {
  var adminSheet = SS.getSheetByName('CRM Copies')
  var gyms = getRowsData(adminSheet)
  gyms.forEach(function(gym){
    var crm = SpreadsheetApp.openById(gym.spreadsheetId)
    var metadataSheet = crm.getSheetByName("DO NOT MODIFY")
    metadataSheet.getRange("A33:B33").setValues([[
      "HighLevel API Key",
      gym.highlevelApiKey
    ]])
    crm.setNamedRange(
      "HighLevelApiKey",
      metadataSheet.getRange("B33")
    )
    console.log("Set API key for %s", gym.gymName)
  })

}
/**
 * Patch 3.25.21 to update existing locations on the admin panel: add location id and location api key
 */
function patch_getHlLocationsData() {
  var locations = HighLevel.getLocations().locations
  var locationsByEmail = hashObjects(locations, 'email')
  var adminSheet = SS.getSheetByName('CRM Copies')
  var gyms = getRowsData(adminSheet)
  gyms.forEach(function(gym){
    var location = locationsByEmail[gym.email]
    if (!location) return
    gym.highlevelLocationId = location.id;
    gym.highlevelApiKey = location.apiKey;
  })

  setRowsData(
    adminSheet,
    gyms,
    {
      startHeader: "HighLevel API Key",
      endHeader: "HighLevel Location ID",
      log: true
    }
  )
}

/**
 * Patch 3.25.21 to push out spreadsheet changes so we can produce challenger reports
 */
function patch_challengeReports() {
  var gyms = getRowsData(SS.getSheetByName('CRM Copies')).slice(1)
  console.log("Updating %s gyms", gyms.length)
  gyms.forEach(patch_updateForChallengeReports)
}

function patch_updateForChallengeReports(gym) {
  console.log("Updating %s", gym.gymName)
  var crmSpreadsheet = SpreadsheetApp.openById(gym.spreadsheetId)
  var gymOwnerSpreadsheet = SpreadsheetApp.openById(gym.sharedSpreadsheetId)
  var webAppUrl = gym.deployedUrl

  // Add URL and named range to gym owner's sheet
  var protectedSheet = gymOwnerSpreadsheet.getSheetByName("Protected")
  protectedSheet.getRange(3,1,1,2).setValues([[
    "Web app url",
    webAppUrl
  ]])
  gymOwnerSpreadsheet.setNamedRange("WebAppUrl", protectedSheet.getRange("B3"))
  SpreadsheetApp.flush()
  console.log("Updated Protected sheet")

  // Insert column and add header and array formula on gym owner's accountability sheet
  var accountabilitySheet = gymOwnerSpreadsheet.getSheetByName("Accountability Tracking")
  accountabilitySheet.insertColumnAfter(34) // After AH
  accountabilitySheet.getRange("AI5:AI7").merge().setValue("Report Link")
  accountabilitySheet.getRange("AI8").setFormula('={"";ARRAYFORMULA(IF(ISBLANK(A9:A),,HYPERLINK(WebAppUrl & "?r=" & ROW(A9:A), "Get Report")))}')
  console.log("Updated gym owner acc. sheet")

  // On crm spreadsheet: update importrange, and show/hide appropriate columns on Acc. tracking
  var crmAccountabilitySheet = crmSpreadsheet.getSheetByName("Accountability Tracking")
  var formulaRange = crmAccountabilitySheet.getRange("A1")
  var formula = formulaRange.getFormula().replace("A:AI", "A:AJ")
  formulaRange.setFormula(formula)
  SpreadsheetApp.flush()

  crmAccountabilitySheet.showColumns(35) // Show the report link column
  crmAccountabilitySheet.hideColumns(36, crmAccountabilitySheet.getMaxColumns() - 36 + 1)
  console.log("Updated crm acc. sheet")

}