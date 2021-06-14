
/**
 * Share a file without sending the usual notification email.
 * If the share fails, log the fact and move on.
 * @param {string} fileId 
 * @param {string} userEmail 
 * @param {string} role owner, organizer, fileOrganizer, writer, commenter, reader,
 * @param {boolean} notifyIfNonGoogle If true, if the email is not a google account(e.g. yahoo), we want to send the notification email
 * We detect this by attempting to suppress notification first.  In this case, sharing will fail with an error message like this:
 * API call to drive.permissions.insert failed with error: Bad Request. User message: "You are trying to invite xxx@yahoo.com. Since there is no Google account associated with this email address, you must check the "Notify people" box to invite this recipient."
 */
function shareSilentlyFailSilently(fileId, userEmail, role, notifyIfNonGoogle){
  role = role || 'reader'
  // Convert email aliases (the ones with +) to their originals.
  var realEmail = userEmail.replace(/\+.+@/,'@')
  try {
    Drive.Permissions.insert(
    {
      'role': role,
      'type': 'user',
      'value': realEmail
    },
    fileId,
    {
      'sendNotificationEmails': 'false'
    });  
    console.log("Shared file %s with %s", fileId, userEmail)
  } catch(err) {
    if (notifyIfNonGoogle && err.message.includes('there is no Google account associated with this email address')) {
      try {
        Drive.Permissions.insert(
        {
          'role': role,
          'type': 'user',
          'value': realEmail
        },
        fileId,
        {
          'sendNotificationEmails': 'true'
        });  
        console.log("Shared file %s with %s", fileId, userEmail)
      } catch(err) {
        console.error("Couldn't share file " + fileId + " with " + realEmail + ": " + err.message, 'Share error')
      }
    } else {
      console.error("Couldn't share file " + fileId + " with " + realEmail + ": " + err.message, 'Share error')
    }
    
  }
}

/**
 * Get a named range from a sheet.  Return null if this sheet doesn't have that named range.
 * Not equivalent to sheet.getRange(name) because this throws an exception if the range doesn't exist 
 * (and worse, can return a range from another sheet if the range does exist on another sheet but not on this one)
 * @param {Sheet} sheet 
 * @param {string} rangeName 
 */
function getRangeByName(sheet, rangeName) {
  var namedRanges = sheet.getNamedRanges();
  var match = namedRanges.find(function(namedRange){
    // console.log("Named range: " + namedRange.getName())
    // Range names may have sheet names, e.g. 'Sheet1'!RangeName, so we want to strip the sheet name:
    return namedRange.getName().replace(/^.*!/, '') === rangeName
  }) // find

  if (match) {
    return match.getRange();
  } else {
    return null;
  }

}

/**
 * Programmatically "Allow Access" for an IMPORTRANGE formula.  Assumes the formula is already present on the sheet.
 * See discussion: https://stackoverflow.com/a/64121004
 * @param {SpreadsheetApp.Range} targetCell Cell with the importrange formula
 * @param {string} sourceId  Id of the Spreadsheet that the importrange points to
 */
function allowAccessImportRange(targetCell, sourceId) {
  var source = DriveApp.getFileById(sourceId)
  var access = source.getSharingAccess()
  var permission = source.getSharingPermission()
  source.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  var formula = targetCell.getFormula()
  targetCell.clearContent()
  SpreadsheetApp.flush()
  targetCell.setFormula(formula)
  SpreadsheetApp.flush()
  // Return to previous sharing settings
  source.setSharing(access, permission);
}


/**
 * Get a link directly to this sheet.
 * @param {Sheet} sheet 
 * @param {Object} options  .noTools: boolean, if true, link to a minimal interface with no Sheets header or toolbar
 */
 function getSheetUrl(sheet, options) {
  var baseUrl = sheet.getParent().getUrl()
  options = options || {}
  // If the url has parameters, remove them, and append #gid=...
  var url = baseUrl.replace(/\?.*$/, '');
  if (options.noTools) url += '?rm=minimal'
  url += '#gid=' + sheet.getSheetId();
  return url
}
