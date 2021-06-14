// Developer email address to be used when testing email sends:
var DEV_EMAIL = ''

/**
 * Transfer all protections in the spreadsheet that the current user has 
 * permission to edit, to the target user.
 * @param {string} targetUser Email address
 */
function transferProtectionsToUser(targetUser, ss) {
  targetUser = targetUser || 'aaron@minstallations.net'
  ss = ss || SpreadsheetApp.getActive();
  
  // Transfer all range protections
  var protections = ss.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  var transferCount = 0;
  for (var i = 0; i < protections.length; i++) {
    var protection = protections[i];
    if (protection.canEdit()) {
      protection.addEditor(targetUser);
      transferCount++;
    }
  }
  console.log("Transferred protections for " + transferCount + " RANGES.")

  // Transfer sheet protections
  var protections = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  var transferCount = 0;
  for (var i = 0; i < protections.length; i++) {
    var protection = protections[i];
    if (protection.canEdit()) {
      protection.addEditor(targetUser);
      transferCount++;
    }
  }
  console.log("Transferred protections for " + transferCount + " SHEETS.")
}


/**
* Copy all protections (Sheet-level and Range-level) from one sheet to another.
* @param {Sheet} sourceSheet
* @param {Sheet} targetSheet
* Adapted from
* https://webapps.stackexchange.com/questions/86984/in-google-sheets-how-do-i-duplicate-a-sheet-along-with-its-permission/87000#87000
*/
function duplicateSheetProtections(sourceSheet,targetSheet) {
  console.log("Adding protections to sheet " + targetSheet.getName())
  // First remove existing protections on the target sheet so they don't get duplicated 

  targetSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function(protection){
    if (protection.canEdit()) protection.remove()
  })

  // Transfer sheet-level protections
  var sourceProtection = sourceSheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0];
  if (sourceProtection){
    var targetProtection = targetSheet.protect();
    console.log("Protecting whole sheet.")
    targetProtection.setDescription(sourceProtection.getDescription());
    targetProtection.setWarningOnly(sourceProtection.isWarningOnly());  
    if (!sourceProtection.isWarningOnly()) {
      var targetProtectionEditors = targetProtection.getEditors()
      targetProtection.removeEditors(targetProtectionEditors);
      var sourceProtectionEditors = sourceProtection.getEditors()
      targetProtection.addEditors(sourceProtectionEditors);
      // This line only needed if file is on a Gsuite Domain:
      targetProtection.setDomainEdit(sourceProtection.canDomainEdit());
    }
    var ranges = sourceProtection.getUnprotectedRanges();
    var newRanges = [];
    for (var i = 0; i < ranges.length; i++) {
      newRanges.push(targetSheet.getRange(ranges[i].getA1Notation()));
    } 
    targetProtection.setUnprotectedRanges(newRanges);
  }
  // Transfer range-level protections
  console.log("Checking for range-level protections.")
  var sourceRangeProtections = sourceSheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var i = 0; i < sourceRangeProtections.length; i++) {
    var sourceProtection = sourceRangeProtections[i];
    var rangeNotation = sourceProtection.getRange().getA1Notation();
    var targetProtection = targetSheet.getRange(rangeNotation).protect();
    console.log("Protecting range " + rangeNotation)
    targetProtection.setDescription(sourceProtection.getDescription());
    targetProtection.setWarningOnly(sourceProtection.isWarningOnly());
    if (!sourceProtection.isWarningOnly()) {
      targetProtection.removeEditors(targetProtection.getEditors());
      targetProtection.addEditors(sourceProtection.getEditors());
      // This line only needed if file is on a Gsuite Domain:
      targetProtection.setDomainEdit(sourceProtection.canDomainEdit());
    }
  }
}

/**
 * Apply a pre-defined protection to a range.
 * @param {SpreadsheetApp.Protection} sourceProtection The Protection object (usually obtained by something like sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE)[0])
 * @param {*} headerRange The range to protect
 */
function applyRangeProtections(sourceProtection, targetRange) {
  var targetProtection = targetRange.protect();
  console.log("Protecting range " + targetRange.getA1Notation())
  targetProtection.setDescription(sourceProtection.getDescription());
  targetProtection.setWarningOnly(sourceProtection.isWarningOnly());
  if (!sourceProtection.isWarningOnly()) {
    targetProtection.removeEditors(targetProtection.getEditors());
    targetProtection.addEditors(sourceProtection.getEditors());
    // This line only needed if file is on a Gsuite Domain:
    targetProtection.setDomainEdit(sourceProtection.canDomainEdit());
  }
}

/**
 * Copy a spreadsheet and transfer its protections.
 * @param {SpreadsheetApp.Spreadsheet} templateFile 
 * @param {string} newFilename 
 */
function copySpreadsheetWithProtections(templateFile, newFilename) {
  newFilename = newFilename || templateFile.getName();
  console.log("Copying file with protections: " + templateFile.getUrl())
  var newCopy = templateFile.makeCopy(newFilename)
  console.log("New copy is at " + newCopy.getUrl())
  // It appears that the protections get copied automatically?
  var sourceSheets = SpreadsheetApp.openById(templateFile.getId()).getSheets()
  var targetSheets = SpreadsheetApp.openById(newCopy.getId()).getSheets()
  for (var i=0; i<sourceSheets.length; i++) {
    duplicateSheetProtections(sourceSheets[i], targetSheets[i])
  }
  return newCopy
}
