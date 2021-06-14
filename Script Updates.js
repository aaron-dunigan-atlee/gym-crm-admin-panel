
/**
 * Step 1 to update all client scripts: push out the template code
 * @param {string[]} scriptIds 
 */
function updateAllClientScripts(scriptIds){
  scriptIds = scriptIds || getAllScriptIds()
  console.log("Attempting to update %s scripts", scriptIds.length)
  var scriptFiles = getScriptContent(TEMPLATE_SCRIPT_ID).files
  scriptIds.forEach(function(scriptId){updateScriptContent(scriptId, scriptFiles)})
}

/**
 * Step 2: re-deploy client crm copies
 */
function updateAllClientDeployments(){
  var crms = getCrmCopiesData()
  console.log("Attempting to update deployment for %s scripts", crms.length)
  crms.forEach(function(crm){redeployWebApp(crm.scriptId, crm.deployedUrl)})
}


/**
 * Get script id's for crm copies and gym owner copies (they use the same script)
 */
function getAllScriptIds() {
  return getRowsData(SS.getSheetByName('CRM Copies')).reduce(function(acc, cur, i){
    if (cur.scriptId) acc.push(cur.scriptId)
    if (cur.sharedScriptId) acc.push(cur.sharedScriptId)
    return acc
  }, [])
}

/**
 * Get script id's for crm copies only (these are the ones that are deployed)
 */
function getCrmCopiesData() {
  return getRowsData(SS.getSheetByName('CRM Copies'))
}
