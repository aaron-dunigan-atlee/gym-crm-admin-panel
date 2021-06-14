/**
 * Create custom menu(s)
 * @param {Event} e 
 */
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('⚙️ Manage CRMs')
      .addItem('➕ Create New CRM Copy', 'showCreateCopySidebar') 
  menu.addToUi();
  // addDebugMenu(ui, true) 
}

function underConstructionAlert() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
     'Work in progress',
     "That function isn't ready yet",
      ui.ButtonSet.OK);
}

/**
 * Include one html template in another, passing an optional context object for filling the template.
 * @param {string} filename 
 * @param {Object} context 
 */
function include(filename, context){
  var template = HtmlService.createTemplateFromFile(filename);
  if (context) template.context = context;
  return template.evaluate().getContent();
}