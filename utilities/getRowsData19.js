/**
 * GetRowsData
 * Version 16
 *  -- Insert rows as needed when using Sheets API 
 *  -- Fix bug that clears wrong range when using getRowsData() with startHeader or endHeader and writeMethod: 'clear'
 * Version 17
 *  -- Global for default header case.
 *  -- (Re-) add preserveFormulas option.
 * Version 18
 *  -- Fix bug that may miss last chunk when getting data in chunks.
 * Version 18.1
 *  -- Fix bug on setRowsData() that didn't convert single object to array.
 * Version 19
 *  -- Add getHeaderColumn() function
 *  -- Add (again) checking for empty objects array in setRowsData()
 */ 

var GETROWSDATA_DEFAULT_HEADER_CASE = 'camel'

// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//   - sheet: the sheet object that contains the data to be processed
//   - range: the exact range of cells where the data is stored
//       This argument is optional and it defaults to all the cells except those in the first row
//       or all the cells below headersRowIndex (if defined).
//   - parameters 
//     headersRowIndex: specifies the row number where the column names are stored.
//       This argument is optional and it defaults to the row immediately above range;
//     getDisplayValues: gets the display values as strings
//   - headersCase: the case of the returned property values, default is lowerCamelCase (camelCase,snake_case,lowercase)
//
// Returns an Array of objects.
//
function getRowsData(sheet, range, parameters) {
  parameters = parameters || {}
  if (sheet.getLastRow() < 2) return [];
  var headersIndex = parameters.headersRowIndex || (range ? range.getRowIndex() - 1 : 1);
  
  var dataRange, base, keys;
  if (!range && (parameters.startHeader || parameters.endHeader)){
    range = getBodyRange(sheet, headersIndex, parameters.startHeader,parameters.endHeader);  
  }
  var numRows = range ? range.getHeight() : parameters.getBlanks ? sheet.getMaxRows() - headersIndex : sheet.getLastRow() - headersIndex;
  if (range){
    dataRange = range;
  } else {
    if (numRows <= 0) return [];
    dataRange = sheet.getRange(headersIndex+1, 1, numRows, sheet.getLastColumn());
  }
  var numCols = dataRange.getWidth();      
  if (numRows * numCols > 999999) parameters.useChunks = true;
  
  var numColumns = dataRange.getLastColumn() - dataRange.getColumn() + 1;
  var headersRange = sheet.getRange(headersIndex, dataRange.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  if (parameters.log) console.log('Getting data from range: '+dataRange.getA1Notation())
  var values = parameters.useChunks ? getValuesChunked(sheet, dataRange, parameters) : (parameters.getDisplayValues || parameters.displayValues) ? dataRange.getDisplayValues() : dataRange.getValues();
  
  parameters.headersCase = parameters.headersCase || GETROWSDATA_DEFAULT_HEADER_CASE;
  if (parameters.headersCase === 'camelCase' || parameters.headersCase === 'camel') keys = normalizeHeaders(headers);
  if (parameters.headersCase === 'snake_case' || parameters.headersCase === 'snake') keys = snakeCaseHeaders(headers);
  if (parameters.headersCase === 'lowercase' || parameters.headersCase === 'lower') keys = lowerCaseHeaders(headers);
  if (parameters.headersCase === 'none') keys = headers;
  if (parameters.getShortcut) base = sheet.getParent().getUrl()+'#gid='+sheet.getSheetId()+'&range=A';
  
  return getObjects_(values, keys, parameters.getBlanks, parameters.getMetadata, dataRange.getRowIndex(), base);
}


function snakeCaseHeaders(headers){
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    keys.push(headers[i].replace(/\W/g,'_').toLowerCase());
  }
  return keys;
}

function lowerCaseHeaders(headers){
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    keys.push(headers[i].replace(/\W/g,'').toLowerCase());
  }
  return keys;
}


// Parameters:
//   - writeMethod:
//       overwrite (default): writes the data regardless of what is already present in the range
//       append: adds the new rows afer the last row with data on the sheet
//       clear: writes the new rows, then clears all rows beneath the destination range
//       delete: writes the new rows, then deletes all rows beneath the destination range
//   - headersRowIndex (integer): index where the column headers are defined. This defaults to the row 1.
//   - startHeader (string): will look for an exact match to be used leftmost bound of the range where data will be written, throws error if not found
//   - endHeader (string): will look for an exact match to be used rightmost bound of the range where data will be written, throws error if not found
//   - omitZeros: if true, cells with the value of zero will be omitted, writing blanks instead
//   - firstRowIndex (integer): index of the first row where data should be written. This defaults to the row immediately below the headers.
//   - headersCase: how to transform the case of the headers (defaults to camelCase), default is lowerCamelCase (camelCase,snake_case,lowercase,none)
//   - headersRange: (range object) the range of the headers
//   - preserveFormulas: if true, don't overwrite formulas with values
//   - preserveArrayFormulas: if true, don't overwrite formulas with values
//
//  Returns a range object where the data was written

function setRowsData(sheet, objects, parameters) {
  parameters = parameters || {};

  // Validate objects parameter
  if (!(objects instanceof Array) && objects instanceof Object) objects = [objects]; //in case only one object is passed instead of an array with one element as intended
  if (objects.length === 0) {
    if (parameters.log) console.warn('setRowsData: Empty data array passed')
    return EmptyRange
  }
  
  var writeMethod = parameters.writeMethod || 'overwrite';
  var headersRowIndex = parameters.headersRowIndex || 1;
  var headersRange = parameters.headersRange || getHeadersRange(sheet,headersRowIndex,parameters.startHeader,parameters.endHeader);
   if (parameters.log) console.log('Headers range is '+headersRange.getA1Notation());
  
  var firstRowIndex;
  if (parameters.firstRowIndex){
    firstRowIndex = parameters.firstRowIndex;
  } else {
    if (writeMethod === 'append') firstRowIndex = sheet.getLastRow()+1;
    if (writeMethod === 'overwrite' || writeMethod === 'clear' || writeMethod === 'delete') firstRowIndex = headersRange.getRowIndex() + 1;
    if (parameters.firstRowIndex) firstRowIndex = parameters.firstRowIndex;
  }
  
  var headers = headersRange.getValues().shift();
  var keys;
  parameters.headersCase = parameters.headersCase || GETROWSDATA_DEFAULT_HEADER_CASE;
  if (parameters.headersCase === 'camelCase' || parameters.headersCase === 'camel') keys = normalizeHeaders(headers);
  if (parameters.headersCase === 'snake_case' || parameters.headersCase === 'snake') keys = snakeCaseHeaders(headers);
  if (parameters.headersCase === 'lowercase' || parameters.headersCase === 'lower') keys = lowerCaseHeaders(headers);
  if (parameters.headersCase === 'none') keys = headers;
  
  var formulaKeys = {};
  if (parameters.preserveArrayFormulas) {
    var headerFormulas = sheet.getRange(1, headersRange.getColumn(), 1, headersRange.getLastColumn()).getFormulas().shift();
    for (j = 0; j < keys.length; ++j) {
      if (headerFormulas[j]) formulaKeys[keys[j]]=true;
    }
  }

  var destinationRange = sheet.getRange(firstRowIndex, headersRange.getColumnIndex(), objects.length, headers.length);
  var formulas = parameters.preserveFormulas ? destinationRange.getFormulas() : null;

  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < keys.length; ++j) {
      var header = keys[j];
      if (header.length > 0){ 
        if (parameters.preserveArrayFormulas && formulaKeys[header]) {
          values.push(null);
        } else if (parameters.preserveFormulas && formulas[i][j]) {
          values.push(formulas[i][j])
        } else if (parameters.omitZeros || parameters.omitZeroes){
          values.push(objects[i][header] ? objects[i][header] : "");
        } else {
          values.push(typeof objects[i][header] !== 'undefined' ? objects[i][header] : ""); //what about null
        }
      } else { //else column header is blank
        values.push("")
      }
    }
    data.push(values);
  }
  
  if (writeMethod === 'clear' && sheet.getLastRow() - destinationRange.getLastRow() > 0){
        var clearRange = sheet.getRange(destinationRange.getLastRow()+1, destinationRange.getColumn(), sheet.getLastRow() - destinationRange.getLastRow(), destinationRange.getWidth());
    console.log('Cleared range: '+clearRange.getA1Notation());
    clearRange.clearContent();
  }
  if (writeMethod === 'delete' && sheet.getMaxRows() - destinationRange.getLastRow() > 0){
    var firstRowToDelete = destinationRange.getLastRow()+1;
    var numRowsToDelete = sheet.getMaxRows() - destinationRange.getLastRow();
    if (parameters.log) console.log('Deleted '+firstRowToDelete+' rows starting on row '+numRowsToDelete+'.');
    sheet.deleteRows(firstRowToDelete,numRowsToDelete);
  }
  // If needed, append rows to sheet.  API doesn't always do this automatically.
  var rowsNeeded = destinationRange.getLastRow() - sheet.getLastRow();
  if (parameters.useSheetsAPI && rowsNeeded > 0) {
    appendRowsToSheet(sheet.getParent().getId(), sheet.getSheetId(), rowsNeeded);
  }
  // Write the data
  if (parameters.useChunks) {
    setValuesChunked(sheet, data, destinationRange, parameters)
  } else {
    var rangeString = "'" + sheet.getName() + "'!" + destinationRange.getA1Notation();
    if (parameters.useSheetsAPI) {
      var options = {
        "valueInputOption": "USER_ENTERED",
        "responseValueRenderOption": "FORMATTED_VALUE"
      }
      var valueRange = {
        "range": rangeString,
        "majorDimension": "ROWS",
        "values": data
      }
      Sheets.Spreadsheets.Values.update(valueRange, sheet.getParent().getId(), rangeString, options)
    } else {
      destinationRange.setValues(data);
    }
  }
  if (parameters.log){
    var plural = data.length > 1 ? 's' : ''
    console.log('Wrote '+data.length+' row'+plural+' of data to range '+destinationRange.getA1Notation()+' on sheet: '+sheet.getName())
  }
  return destinationRange
}



//Helper function that gets the headers range, optionally matching header values to determine start and end 
function getHeadersRange(sheet,headersRowIndex,startHeader,endHeader){
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(headersRowIndex,1,1,lastCol).getValues().shift();
  var columnBounds = getStartEndColumns(headers,startHeader,endHeader,lastCol)
  lastCol = columnBounds.endCol - columnBounds.startCol+1;
  var headersRange = sheet.getRange(headersRowIndex, columnBounds.startCol, 1, lastCol);
  return headersRange;
}

//Helper function that gets the body range, optionally matching header values to determine start and end 
function getBodyRange(sheet,headersRowIndex,startHeader,endHeader){
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(headersRowIndex,1,1,lastCol).getValues().shift();
  var columnBounds = getStartEndColumns(headers,startHeader,endHeader,lastCol)
  lastCol = columnBounds.endCol - columnBounds.startCol+1;
  var numRows = sheet.getLastRow() - headersRowIndex;
  var bodyRange = sheet.getRange(headersRowIndex+1, columnBounds.startCol, numRows, lastCol);
  return bodyRange;
}

function getStartEndColumns(headers,startHeader,endHeader,lastCol){
  if (!endHeader) var endCol = lastCol
  if (endHeader) {
    var endCol = headers.indexOf(endHeader)+1;
    if (!endCol){
      throw 'endHeader "'+endHeader+'" column not found';
    }
  }
  if (!startHeader) var startCol = 1;
  if (startHeader){
    var startCol = headers.indexOf(startHeader)+1;
    if (!startCol){
      throw 'startHeader "'+startHeader+'" column not found';
    }
  }
  if (endCol > startCol) {
    return {startCol:startCol,endCol:endCol};
  } else {
    return {startCol:endCol,endCol:startCol};
  }
}



// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//   - data: JavaScript 2d array
//   - keys: Array of Strings that define the property names for the objects to create
function getObjects_(data, keys, getBlanks, getMetadata, dataRangeStartRowIndex, base) {
  var objects = [];
  
  for (var i = 0; i < data.length; ++i) {
    var object = getMetadata ? {arrayIndex:objects.length,sheetRow:i+dataRangeStartRowIndex} : {};
    if (base) object.shortcut = base + (i+dataRangeStartRowIndex);
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty_(cellData)) {
        if (getBlanks){
          object[keys[j]] = '';
          hasData = true;
        }
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}


// Returns an Array of normalized Strings.
// Empty Strings are returned for all Strings that could not be successfully normalized.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    keys.push(normalizeHeader(headers[i]));
  }
  return keys;
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum_(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit_(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty_(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum_(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit_(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit_(char) {
  return char >= '0' && char <= '9';
}




/** 
 * Set values in chunks by row, to avoid timeout.  Default to chunks of 1000 rows.
 */
function setValuesChunked(sheet, values, destinationRange, parameters) {
  chunkSize = parameters.chunkSize || 1000;
  console.log("Setting rows in chunks of size %s.",chunkSize)
  var startRow = destinationRange.getRow();
  var endRow = destinationRange.getLastRow();
  var startColumn = destinationRange.getColumn();
  var rangeWidth = destinationRange.getWidth();
  var chunkStart = 0; // index in 'values' array, of starting row for this chunk.
  while (chunkStart < values.length) {
    var chunkEnd = Math.min(chunkStart + chunkSize, values.length); // chunkEnd is exclusive: we will chunk up to but not including this index.
    var chunkRange = sheet.getRange(startRow + chunkStart, startColumn, chunkEnd-chunkStart, rangeWidth);
    try {
      setThisChunk()
    } catch(err) {
      console.error(err)
      console.log("Trying again...")
      SpreadsheetApp.flush();
      Utilities.sleep(101000);
      console.log("Waiting a full 101 seconds...")
      setThisChunk();
    }
    chunkStart += chunkSize;
  }
  console.log("Finished setting all values.")
  return;

  // Private functions
  // -----------------

  function setThisChunk() {
    if (parameters.useSheetsAPI) {
      var rangeString = "'" + sheet.getName() + "'!" + chunkRange.getA1Notation();
      console.log("Sending Sheets API request to set chunk " + rangeString);
      var options = {
        "valueInputOption": "USER_ENTERED",
        "responseValueRenderOption": "FORMATTED_VALUE"
      }
      var valueRange = {
        "range": rangeString,
        "majorDimension": "ROWS",
        "values": values.slice(chunkStart, chunkEnd)
      }
      Sheets.Spreadsheets.Values.update(valueRange, sheet.getParent().getId(), rangeString, options)
    } else {
      chunkRange.setValues(values.slice(chunkStart, chunkEnd))
    }
    console.log("Set values on chunk for " + chunkRange.getA1Notation())
  } // setValuesChunked.setThisChunk()

} // setValuesChunked()



/** 
 * Gets values in chunks by row, to avoid error "Requested data exceeds the maximum allowed size. Please get a smaller range of cells".
 Default to chunks of 5000 rows.
 */
function getValuesChunked(sheet, dataRange, parameters) {
  chunkSize = parameters.chunkSize || 5000;
  if (parameters.log) console.log("Getting rows in chunks of size %s from range %s.",chunkSize, dataRange.getA1Notation())
  var startRow = dataRange.getRow();
  var endRow = dataRange.getLastRow();
  var numRows = dataRange.getHeight();
  var startColumn = dataRange.getColumn();
  var numCols = dataRange.getWidth();
  var values = [];
  var chunkStart = startRow;
  
  while (chunkStart < numRows) {
    var chunkEnd = Math.min(chunkStart + chunkSize, numRows + startRow); // 
    var chunkRange = sheet.getRange(chunkStart, startColumn, chunkEnd-chunkStart, numCols);
    if (parameters.log) console.log('Getting values from chunkRange: '+chunkRange.getA1Notation());
    var chunkValues = (parameters.getDisplayValues || parameters.displayValues) ? chunkRange.getDisplayValues() : chunkRange.getValues();
    Array.prototype.push.apply(values, chunkValues);
    chunkStart += chunkSize;
  }
  if (parameters.log) console.log("Finished getting all values.")
  return values;
}

function appendRowsToSheet(spreadsheetId, sheetId, numRows) {
  var request = {
    "appendDimension": {
      "sheetId": sheetId,
      "dimension": 'ROWS',
      "length": numRows
    }
  }
  Sheets.Spreadsheets.batchUpdate({"requests": [request]}, spreadsheetId)
}

/**
 * Find the column index in the header row, for a given header text.
 * @param {Sheet} sheet 
 * @param {string} header Must match exact cell text
 * @param {Object} parameters {'headersRowIndex': integer -- row to look for the headers; defaults to 1}
 * @returns {integer} The sheet column index, or 0 if not found.
 */
function getHeaderColumn(sheet, header, parameters) {
  parameters = parameters || {}
  var headersIndex = parameters.headersRowIndex || 1;
  var headers = sheet.getRange(headersIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(header) + 1
}

// A dummy object so we don't throw errors on range.getA1Notation() when there's no data written by setRowsData().
var EmptyRange = {
  'getA1Notation': function(){return 'Empty range'}
}