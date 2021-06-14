/**
 * Get the cached object and continue onboard
 * @param {Event} e 
 */
function onBoardingContinuation(e) {
  // Remove the one-time trigger that called this.
  if (e && e.triggerUid) {
    deleteTriggerById(e.triggerUid)
    console.log("Deleted one-off trigger with id %s", e.triggerUid)
    var param = CacheService.getScriptCache().get(e.triggerUid + '_param') 
    processOnboardingRequest(JSON.parse(param))
  } else {
    throw new Error("No trigger id was provided")
  }
}

/**
 * Webhook called during onboarding of new gym owners.  We automate creation of the gym's spreadsheets.
 * @param {Object} params Webhook object from High Level.  See sample below.
 */
function processOnboardingRequest(params) {
  // For testing:
  params = params || SAMPLE_ONBOARDING_PARAMS
  sheetLog(JSON.stringify(params), 'onboarding request', 'info')
  
  try {
    // Get the info we need from the payload
    var gymInfo = {
      gymOwner: params.full_name,
      gymName: params.company_name,
      // accountType: 'SAAS', // Will be set manually
      email: params.email,
      highlevelLocationId: getLocationId(params),
    }
    console.log("Making new gym with these details: %s", JSON.stringify(gymInfo))

    // Create the spreadsheets
    makeNewCopy(gymInfo)

    // Return success message
    sheetLog(JSON.stringify(gymInfo), 'onboarding success', 'info')
    // return ContentService.createTextOutput('OK');
  } catch(err) {
    sheetLog(err.message + '\n' + err.stack, 'error')
    // return ContentService.createTextOutput('error');
  }
}

/**
 * Get a new gym owner's location id.  It's not passed in the webhook so we have to look it up using the users object
 * @param {Object} params The onboarding params from the webhook.  See sample below.
 */
function getLocationId(params) {
  console.log("Searching for location id for these params: %s", JSON.stringify(params))
  var locationId = null;

  // First get all agency users
  var users = HighLevelAgency.getUsers().users
  try {
    // Match by name and email
    var thisUser = users.find(function(user){
      return user.name === params.full_name && user.email === params.email
    })
    if (!thisUser) throw new Error("Couldn't find an agency user to match the onboarding name and email")
    // Get the location id
    var locationIds = thisUser.roles.locationIds
    if (!locationIds || locationIds.length === 0) throw new Error("No location ID available for the onboarding user")
    // It's possible for a user to have more than one location.  Take the last locationId given.
    locationId = locationIds.pop()
    // This error will not halt execution since locationId has been assigned.
    if (locationIds.length > 0) throw new Error("Multiple location ID's are available for the onboarding user. Check that the location ID and High Level API Key are correct in the Admin Panel.")

  } catch(err) {
    // If any error, or more than one locationId present, notify so we can adjust if needed.
    var message = "There was a problem in the automated onboarding.  Please double check this gym owner's info in the Admin Panel.  Some onboarding may need to be done manually.\n\n"
    message += JSON.stringify(params,null,2)
    var halt = !Boolean(locationId)
    notifyError(err, halt, message)
  }

  return locationId 
}

/*
Sample payload:
*/
var SAMPLE_ONBOARDING_PARAMS = {
  "contact_id": "QQwmI9UU94rH9CQg6ppP",
  "first_name": "Aaron",
  "last_name": "Developer",
  "full_name": "Aaron Developer",
  "email": "wzebra@yahoo.com",
  "phone": "+18132308444",
  "tags": "",
  "address1": "2185 Bronson St.",
  "city": "Fort Collins",
  "state": "Colorado",
  "country": "US",
  "date_created": "2021-04-05T21:31:33.055Z",
  "postal_code": "80526",
  "company_name": "Aaron testing sample gym",
  "contact_source": "saas funnel",
  "full_address": "2185 Bronson St. Fort Collins Colorado 80526",
  "contact_type": "lead",
  "gclid": null,
  "location": {
   "name": "Max Out Your Gym",
   "address": "30 North Gould St Ste 2476",
   "city": "Sheridan",
   "state": "WY",
   "country": "US",
   "postalCode": "82801",
   "fullAddress": "30 North Gould St Ste 2476, Sheridan WY 82801",
   "id": "5ZVpIAdJfn5nx2rDv7oU"
  },
  "order": {
   "funnelId": "pVgM6VIw9Sl3Sp2R8TFm",
   "pageId": "6WSfeg1IBupZip6dUzbX",
   "submissionType": 2,
   "orderId": "sub_JO1WBjU8uXVw7b",
   "amount": 97,
   "currency": "usd",
   "stripePlanId": "price_1ICKJ9JD5UbfQq9HLhE7zocH",
   "stripeProductId": "prod_InwBJ5f1rVZAm0",
   "stripeCustomerId": "cus_JO1WHb3BHA230s",
   "productId": "863636f0-06b4-492b-8d77-d353168837d8",
   "productName": "MAXOUT All-In-One Platform",
   "metadata": {
    "funnelId": "pVgM6VIw9Sl3Sp2R8TFm",
    "stepId": "8c43b472-ee8a-481e-8bd1-47c423638d1a",
    "pageId": "6WSfeg1IBupZip6dUzbX",
    "fingerprint": "5ab9e025-d356-41c1-af2d-d9b1b1323c4d",
    "companyId": "rvSqL62IXEg5UZHuTGHr",
    "locationId": "5ZVpIAdJfn5nx2rDv7oU",
    "contactId": "QQwmI9UU94rH9CQg6ppP"
   }
  }
 }