// This function will create three new menu items on a new tab upon loading spreadsheet
function onOpen() {
    SpreadsheetApp.getUi().createMenu('ECF Tools')
      .addItem('Create Pivot', 'generatePivot')
      .addItem('Card Check-In', 'openSheetSelector')
      .addItem('Reset Spreadsheet', 'fullReset')
      .addToUi()
     var ss = SpreadsheetApp.getActiveSpreadsheet()
     if (ss.getSheetByName("WhenIWork Export") == null) {
         ss.insertSheet("WhenIWork Export")
     }
     PropertiesService.getUserProperties().setProperty('cur_sheet', "empty");
     var sheet_arr = ss.getSheets();
     for (var i = 0; i < sheet_arr.length; i ++) {
         var cur_name = sheet_arr[i].getSheetName()
         if (cur_name.indexOf("_raw") != -1) {
             var subStr = cur_name.substring(0, cur_name.length - 4);
             if (sheet_arr.indexOf(subStr) == -1)
             {
                 var delSheet = ss.getSheetByName(cur_name)
                 ss.deleteSheet(delSheet)
             }
         }
     }
}

function fullReset() {
    var ui = SpreadsheetApp.getUi()
    var promptResult = ui.alert("Are you sure you want to reset?", "Resetting the spreadsheet will remove all schedules, check-in data, and sheets", ui.ButtonSet.OK_CANCEL)
    if (promptResult != ui.Button.OK)
    {
      return;
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet_arr = ss.getSheets();
    for (var i = 0; i < sheet_arr.length; i ++) {
        if (sheet_arr[i].getSheetName() != "WhenIWork Export") {
            ss.deleteSheet(sheet_arr[i]);
        }
        else {
            sheet = sheet_arr[i];
            cur_range = sheet.getDataRange();
            cur_range.setValue("");
        }
    }
}

function stringToColor(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

function generatePivot() {
    //ask user what the new sheet name should be
    var ui = SpreadsheetApp.getUi();
    var name_response = ui.prompt("Schedule Name", "Enter the name you want the new schedule sheet to be called", ui.ButtonSet.OK_CANCEL);
    if (name_response.getSelectedButton() != ui.Button.OK || name_response.getResponseText() == "") {
      return;
    }
    var new_sheet_name = name_response.getResponseText();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data_sheet = ss.getSheetByName('WhenIWork Export');
    
    //setup temporary sheet to create pivot on, then copy values to new sheet for custom formatting otherwise restricted by pivot tables
    var pivot_sheet = ss.getSheetByName("Temporary Pivot Sheet");
    if (pivot_sheet != null) {
       ss.deleteSheet(pivot_sheet);
    }
    pivot_sheet = ss.insertSheet("Temporary Pivot Sheet");
    pivot_sheet.activate();
    pivot_sheet.hideSheet();
    
    var pivotTableParams = {};
    pivotTableParams.source = {
      sheetId: ss.getSheetByName("WhenIWork Export").getSheetId(),
      endRowIndex: data_sheet.getLastRow(),
      endColumnIndex: data_sheet.getLastColumn()
    };
    pivotTableParams.rows = [{
      sourceColumnOffset: 1,
      "showTotals": false,
      sortOrder: "ASCENDING"
    }];
    pivotTableParams.columns = [{
      sourceColumnOffset: 6,
      sortOrder: "ASCENDING"
    }];
    pivotTableParams.values = [{
      summarizeFunction: "CUSTOM",
      "formula": '=JOIN(",",Position)',
    }];
    
    var request = {
      "updateCells": {
        "rows": {
          "values": [{
            "pivotTable": pivotTableParams
          }]
        },
        "start": {
          "sheetId": pivot_sheet.getSheetId()
        },
        "fields": "pivotTable"
      }
    };
    var response = Sheets.Spreadsheets.batchUpdate({'requests': [request]}, ss.getId());
    Logger.log(response);
    Logger.log(pivot_sheet.getLastRow(), pivot_sheet.getLastColumn());
    SpreadsheetApp.flush();
    var pivotRange = pivot_sheet.getDataRange();
    var hourly_sheet = ss.getSheetByName(new_sheet_name);
    if (hourly_sheet != null) {
      ss.deleteSheet(hourly_sheet);
    }
    var sheetColor = stringToColor(new_sheet_name)
    hourly_sheet = ss.insertSheet(new_sheet_name);
    hourly_sheet.activate();
    hourly_sheet.getRange(1, 1, pivot_sheet.getLastRow(), pivot_sheet.getLastColumn()).setValues(pivotRange.getValues());
    hourly_sheet.deleteRow(1);
    hourly_sheet.autoResizeColumn(1);
    hourly_sheet.setFrozenRows(1);
    var changeRange = hourly_sheet.getRange(1,1,1,hourly_sheet.getLastColumn());
    changeRange.setFontColor("#F1BE48"); 
    changeRange.setFontSize(11);
    changeRange.setFontWeight("bold");
    changeRange.setBackground("#C8102E");
    changeRange.setNumberFormat("h:mm am/pm");
    var wrapRange = hourly_sheet.getRange(1, 1, hourly_sheet.getLastRow(), hourly_sheet.getLastColumn());
    wrapRange.setWrap(true);
    wrapRange.setBorder(false, false, true, true, false, false);
    wrapRange.createFilter();
    var employeeRange = hourly_sheet.getRange(1, 1, hourly_sheet.getLastRow());
    employeeRange.setBorder(false, false, true, true, false, false);
    employeeRange.setFontWeight("bold");
    employeeRange.setFontSize(11);
    ss.deleteSheet(pivot_sheet);
    hourly_sheet.getRange(1, 1).setValue("Ambassadors");
    shift_vals = wrapRange.getValues();
    for (var i = 0; i < shift_vals.length; i++) {
      for (var j = 0; j < shift_vals[i].length; j ++) {
        var str = shift_vals[i][j].toString();
        if (str.indexOf("Head") != -1) {
          hourly_sheet.getRange(i + 1, 1).setBackground("#F1BE48");
        }
      }
    }
    hourly_sheet.insertColumnBefore(2)
    var IDrange = hourly_sheet.getRange(1, 2, hourly_sheet.getLastRow())
    hourly_sheet.hideColumn(IDrange)
    hourly_sheet.getRange(2, 2, hourly_sheet.getLastRow() - 1, 1).setFormula("=INDEX('WhenIWork Export'!C:C, MATCH(INDIRECT(\"R[0]C[-1]\", false), 'WhenIWork Export'!B:B, 0))")
    hourly_sheet.getRange(1,2).setValue("ID Number")
    hourly_sheet.setTabColor(sheetColor)
}

function openSheetSelector() {
    var ui = SpreadsheetApp.getUi()
    var totalSheetList = SpreadsheetApp.getActiveSpreadsheet().getSheets()
    var sheetList = [];
    for (var i = 0; i < totalSheetList.length; i++) {
        if (totalSheetList[i].getSheetName().indexOf("_raw") == -1 && totalSheetList[i].getSheetName() != "WhenIWork Export") {
            sheetList.push(totalSheetList[i])
        }
    }
    var template = HtmlService.createTemplateFromFile('SheetSelect');
    template.data = sheetList;
    var html = template.evaluate()
    ui.showModalDialog(html, "Select a schedule to perform check-in")
}

function openSwipeWindow() {
  var ui = SpreadsheetApp.getUi()
  var template = HtmlService.createTemplateFromFile('Index')
  var html = template.evaluate()
  ui.showModalDialog(html, 'ECF Ambassador Check-In');
}

function setProperty(id) {
    var cur_sheet = PropertiesService.getUserProperties()
    cur_sheet.setProperty('cur_sheet', id);
}

var Shift = function(title, time, row, column, checked) {
    this.title = title
    this.time = time
    this.row = row
    this.column = column
    this.checked = checked
}

var Ambassador = function(name, row) {
    this.name = name
    this.row = row
    this.shifts = []
}

function testShit() {
  openSwipeWindow()
}

function performCheckIn(studentID) {
    
    function testMatch(cell_value) {
        var cellStr = cell_value.toString()
        var idStr = studentID.toString()
        return cellStr == idStr
    }
    
    var ui = SpreadsheetApp.getUi()

    var ambassador
    var checked_shifts = [];
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var cur_sheet = PropertiesService.getUserProperties().getProperty('cur_sheet');
    var sheet = ss.getSheetByName(cur_sheet);
    
    var date = new Date();
    
    var IDrange = sheet.getRange(2, 2, sheet.getLastRow()).getValues()
    var row = IDrange.findIndex(testMatch)
    var first_shift = true
    
    if (row != -1) {
        ambassador = new Ambassador(sheet.getRange(row + 2, 1).getValue(), row + 2)
        var shiftRangeValues = sheet.getRange(row + 2, 3, 1, sheet.getLastColumn()).getValues()
        for (var i = 0; i < shiftRangeValues[0].length; i ++) {
            if (shiftRangeValues[0][i] != "") {
                var shift_time = sheet.getRange(1, i + 3).getDisplayValue()
                var shift_hour = parseInt(shift_time.toString().split(":")[0])
                if (shift_time.indexOf("PM") != -1 && shift_hour != 12) {
                    shift_hour += 12
                }
                var shift_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), shift_hour, parseInt(shift_time.toString().split(":")[1].split(" ")[0]), 0)
                var diff = (date - shift_date)/60000
                if (first_shift && (diff <= 15 && diff >= -60)) {
                    ambassador.shifts.push(new Shift(shiftRangeValues[0][i], shift_time, row + 2, i + 3, true));
                    sheet.getRange(row + 2, i + 3).setBackground("#b7e1cd");
                    date = shift_date;
                    first_shift = false;
                    i = -1;
                    continue;
                }
                else if (!first_shift && (diff == -60)) {
                    ambassador.shifts.push(new Shift(shiftRangeValues[0][i], shift_time, row + 2, i + 3, true));
                    sheet.getRange(row + 2, i + 3).setBackground("#b7e1cd");
                    date = shift_date;
                    i = -1;
                    continue;
                }
            }
        }
    }
    var template = HtmlService.createTemplateFromFile('ShiftDisplay');
    if (row == -1) {
        template.found = false
    }
    else {
        template.found = true
    }
    template.ambassador = ambassador;
    var html = template.evaluate()
    ui.showModalDialog(html, "Shift Display")
}