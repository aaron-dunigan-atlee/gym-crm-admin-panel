/**
 * Scripts by Aaron Dunigan AtLee
 * aaron.dunigan.atlee -at- gmail
 * Feb-June 2021
 */

var SS = SpreadsheetApp.getActive()

var CRM_TEMPLATE_ID = '1O7ZRjf0umnnSD203Bte1HVnULtzH6IrehSlOJlX-TQo'
var GYM_OWNER_TEMPLATE_ID = '1p28mKYUy5E9h3MY9fe6yomvpqYtfYgOhT5K8gF1xfjo'
// The script id for the CRM Template script:
var TEMPLATE_SCRIPT_ID = '1l6toBqNpB69I8w8dG877dpUH2zMIujbFH1PDe8yVKNKdOBe7g9dI_zBT'

var GYM_OWNER_FOLDER_ID = '1VU5Nji4iOizpzozFUkHno1TOmdyQsMsS'

/* Sidebar branding */
var BRAND_LOGO_URL = 'https://www.maxoutyourgym.com/hosted/images/ef/de4d60d55511e88f42836ab5aa5bf0/maxoutyourgym.png';
var BRAND_PRIMARY_COLOR = '#07243c'
var BRAND_HIGHLIGHT_COLOR = '#e15d3a';
var BRAND_BACKGROUND_COLOR = '#fff';
var BRAND_TEXT_COLOR = '#07243c';
var BRAND_HOVER_COLOR = '#e15d3a';

// Sheet names (on templates)
var ACCOUNTABILITY_SHEET_NAME = "Accountability Tracking"
var CRM_SHEET_NAME = "CRM Tracking Sheet"
var SETTINGS_SHEET_NAME = 'Settings'

// Header row for each sheet
var ACCOUNTABILITY_HEADERS_ROW = 5;
var ACCOUNTABILITY_START_ROW = 9;
var CRM_HEADERS_ROW = 1;
var HEADER_ROWS_BY_SHEET_NAME = {
  // CRM Tracking Sheet
  'CRM Tracking Sheet': CRM_HEADERS_ROW,
  // Accountability Tracking
  'Accountability Tracking': ACCOUNTABILITY_HEADERS_ROW
}

var ONBOARDING_DELAY = 5 // Minutes to wait before onboarding for user to register in high level