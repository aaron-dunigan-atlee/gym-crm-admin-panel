/**
 * Tools for Apps Scripts API
 * Compiles Feb. 2021 by Aaron Dunigan-AtLee
 * See https://developers.google.com/apps-script/api/reference/rest   
 */ 


function callScriptsApi(method, endpoint, payload) {

  var root = 'https://script.googleapis.com/v1/';
  
  var params = {
    'method': method,
    // 'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
     }
  };
  if (DEBUG) params.muteHttpExceptions = true;
  if (payload) {
    params.payload = JSON.stringify(payload)
    params.contentType = 'application/json' //If the content type is set then you can stringify the payload
  }
  
  var response = DEBUG ? 
    UrlFetchApp.fetch(root + endpoint, params) :
    FetchTools.backoffOne(root + endpoint, params);
  var content = response.getContentText();

  if (DEBUG) console.log("Apps Script API endpoint %s returned this response:\n%s", endpoint, content)

  // Some endpoints return empty response.
  if (!content) return null;

  var json = JSON.parse(content);
  return json;
  
}

/**
 * Deploy a script.  Note if the script is already deployed, this will generate a distinct deployment with a new web app URL.
 * Use redeployWebApp() to keep the same url but update the deployment to the latest code.
 * @param {string} scriptId 
 */
function deployWebApp(scriptId) {
  // scriptId = scriptId || ScriptApp.getScriptId()
  // Create a new script version 
  var newVersion = callScriptsApi('post', 'projects/' + scriptId + '/versions')

  // Create a deployment for that script version, and get the web app url
  var deployment = callScriptsApi(
    'post', 
    'projects/' + scriptId + '/deployments',
    {
      "versionNumber": newVersion.versionNumber.toString(),
      // "manifestFileName": string,
      "description": "Automated deployment by Max Out Your Gym"
    }
  )

  // Return the url 
  var url = deployment.entryPoints
    .find(function(entryPoint){return entryPoint.entryPointType === 'WEB_APP'})
    .webApp
    .url;

  return url;
}

function getDeployments(scriptId) {
  scriptId = scriptId || '1Nz30UhMEFb-4RjJD1_MNJ1_CtJbd4kqwvbg7c-L6iv5IJ7X1ibRKPSCY' // ScriptApp.getScriptId()
  return callScriptsApi('get', 'projects/' + scriptId + '/deployments')
}

function getScriptContent(scriptId) {
  return callScriptsApi('get', 'projects/' + scriptId + '/content')
}



function updateScriptContent(scriptId, files) {
  // Don't try to overwrite this script or the template
  if (scriptId === ScriptApp.getScriptId() || scriptId === TEMPLATE_SCRIPT_ID) return;

  console.log("Attempting to update script %s", scriptId)
  var result = callScriptsApi(
    'put', 
    'projects/' + scriptId + '/content', 
    {
      'files': files
    }
  )

  if (result.scriptId) console.log("Successfully updated %s", result.scriptId)
}

/**
 * Update an existing deployment of a web app to the latest code.
 * @param {string} scriptId 
 * @param {string} url Url of the existing deployment we want to update.
 */
function redeployWebApp(scriptId, url) {

  // Create a new script version 
  var newVersion = callScriptsApi('post', 'projects/' + scriptId + '/versions')

  try {
    // Find the existing deployment with that url (a script can have multiple active deployments)
    var deployments = getDeployments(scriptId).deployments
    var deployment = deployments.find(function(d){
      return d.entryPoints && d.entryPoints.some(function(entryPoint){
        return entryPoint.entryPointType === 'WEB_APP' && entryPoint.webApp.url === url 
      })
    })
    if (!deployment) throw new Error("No existing deployment found with URL " + url)

    // Update the deployment to that script version
    var deployment = callScriptsApi(
      'put', 
      'projects/' + scriptId + '/deployments/' + deployment.deploymentId,
      {
        "deploymentConfig": {
          "scriptId": scriptId,
          "versionNumber": newVersion.versionNumber.toString(),
          // "manifestFileName": string,
          "description": "Automated deployment by Max Out Your Gym Admin Panel"
        }
      }
    )

    console.log("Updated deployment to version %s for script %s", newVersion.versionNumber, scriptId )
    

  } catch(err) {
    console.error("Error redeploying script %s:\n%s", scriptId, err.message)
  }
}

function runScriptFunction(scriptId, functionName) {
  
}