/* Server globals */

// The client spreadsheet.  To be defined in the doPost
var CLIENT_SPREADSHEET;

var DEBUG_MODE = false;

/**
 * This web app is doing double duty: it processes requests from all our client sheets,
 * but it also processes onboarding requests from High Level.
 * So we need to identify the request type and route it correctly.
 * @param {Event} e
 */
function doPost(e) {
 // sheetLog(JSON.stringify(e), 'e')
 // console.log(JSON.stringify(e))
 var params = JSON.parse(e.postData.contents);

 if (params.action && params.fileId) {
  return processClientRequest(params);
 } else {
  setContinuationTrigger(
   "onBoardingContinuation",
   ONBOARDING_DELAY * 60 * 1000,
   JSON.stringify(params)
  );
  return ContentService.createTextOutput("OK");
 }
}

/**
 * Process a request from a client script to perform an action
 * @param {Object} params   e.postData.contents with the following fields:
 *    config.action {string}    Required.  Name of a public method on the server.
 *    config.fileId {string}    Required.  ID of file issuing the request
 *    config.user {string}      Optional.  Email address of user who issued the request, if available.
 *    config.arguments {Object} Optional.  Named arguments for the action.
 */
function processClientRequest(params) {
 // List functions here to make them available to the client scripts.
 var Server = {
  testServerConnection: testServerConnection,
  registerCopy: registerCopy,
  removeTwilioAuth: removeTwilioAuth,
  setTwilioAuth: setTwilioAuth,
 };

 try {
  console.log("Received request:\n%s", JSON.stringify(params, null, 2));

  params.timestamp = new Date();

  // Validate the request
  if (!params.fileId) {
   return logAndReturn(params, {
    status: "error",
    message: "A fileId must be specified.",
   });
  }

  if (!params.scriptId) {
   return logAndReturn(params, {
    status: "error",
    message: "A scriptId must be specified.",
   });
  }

  if (!params.action) {
   return logAndReturn(params, {
    status: "error",
    message: "An action must be specified.",
   });
  }

  if (!Server[params.action] || !Server[params.action] instanceof Function) {
   return logAndReturn(params, {
    status: "error",
    message: 'There is no server command called "' + params.action + '"',
   });
  }

  // If we can't open the file, this will throw an error to be caught below.
  CLIENT_SPREADSHEET = SpreadsheetApp.openById(params.fileId);
  params.fileName = CLIENT_SPREADSHEET.getName();

  // sheetLog(JSON.stringify(params, null, 2))

  // Phew. The request is valid.  Process it.
  if (params.user == DEV_USER) {
   DEBUG_MODE = true;
   sheetLog("Entering debug mode.", "Debug");
  }
  params.arguments = params.arguments || {};
  params.arguments.user = params.user;
  params.arguments.fileId = params.fileId;
  params.arguments.scriptId = params.scriptId;
  var result = Server[params.action](params.arguments);
  return logAndReturn(params, result);
 } catch (err) {
  return logAndReturn(params, {
   status: "error",
   message: err.message + "\n" + err.stack,
  });
 }
}

/**
 * Log to the sheet and return the result to the client.
 * @param {Object} params
 * @param {Object} result Data to return to client.  Should include, at a minimum, .status and .message
 */
function logAndReturn(params, result) {
 try {
  Object.assign(params, result);
  params.arguments = JSON.stringify(params.arguments);
  var logSheet = SS.getSheetByName("Access Log");
  if (logSheet) setRowsData(logSheet, params, { writeMethod: "append" });
 } catch (err) {
  console.error("Failed to log results: " + err.message);
 }
 return ContentService.createTextOutput(JSON.stringify(result));
}

function testServerConnection(args) {
 // Display success notification
 return {
  status: "success",
  title: "Test Server Connection",
  message: "You are connected to the server.",
 };
}

function doGet(e) {
 return ContentService.createTextOutput("OK");
}