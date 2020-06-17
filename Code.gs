var Ambassador = function(name, shifts) {
  this.name = name;
  this.shifts = shifts;
}

var Shift = function(position, time, location) {
  this.position = position;
  this.time = time;
  this.location = location;
}

// This function will create two new tabs on the menu upon loading spreadsheet
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ECF Tools')
    .addItem('Card Check-In', 'openWindow')
    .addItem('Create Pivot', 'generatePivot')
    .addToUi()
}

function openWindow() {
//  var html = HtmlService.createHtmlOutputFromFile('Index')
//      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
//  SpreadsheetApp.getUi()
//      .showModalDialog(html, 'ECF Ambassador Check-In');
  var ui = SpreadsheetApp.getUi();
  ui.prompt("Please enter or swipe your ISU ID", ui.ButtonSet.OK_CANCEL);
}

function getPureText(input) {
  return input;
}

function generatePivot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
//  var data_sheet = ss.getSheetByName('WhenIWork Export');
//  var pivot_sheet = ss.getSheetByName("Hourly Schedule");
//  if (pivot_sheet == null) {
//     ss.insertSheet("Hourly Schedule");
//     pivot_sheet = ss.getSheetByName("Hourly Schedule");
//  }
//  pivot_sheet.activate();
  var pivotTableParams = {};
  pivotTableParams.source = {
    sheetID: ss.getSheetByName("WhenIWork Export").getSheetId()
  };
  pivotTableParams.rows = [{
    sourceColumnOffset: 1,
    sortOrder: "ASCENDING"
  }];
  pivotTableParams.columns = [{
    sourceColumnOffset: 6,
    sortOrder: "ASCENDING"
  }];
  pivotTableParams.values = [{
    summarizeFunction: "COUNTA",
    sourceColumnOffset: 4
  }];
  
  var pivotTableSheet = ss.insertSheet();
  var pivotTableSheetId = pivotTableSheet.getSheetId();
  
  var request = {
    "updateCells": {
      "rows": {
        "values": [{
          "pivotTable": pivotTableParams
        }]
      },
      "start": {
        "sheetId": pivotTableSheetId
      },
      "fields": "pivotTable"
    }
  };
  
  Sheets.Spreadsheets.batchUpdate({'requests': [request]}, ss.getId());
}

function performCheckIn() {
}
