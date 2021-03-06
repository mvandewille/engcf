
var shifts;
var checked_shifts = [];
var done;



//Main method to call each helper method.
function main()
{
    done = false;
    shifts = JSON.parse(window.localStorage.getItem("shiftArr"));
    var userID = get_ID();
    if (!userID)
    {
        document.getElementById("IDswipeform").reset();
        document.getElementById("dvSchedule").innerHTML = "";
    }
    else
    {
            var totalUserShifts = get_shifts(userID);
        if (totalUserShifts.length == 0)
        {
            alert("No shifts found!");
            document.getElementById("IDswipeform").reset();
            document.getElementById("dvSchedule").innerHTML = "";
            return false;
        }
        else
        {
            var checked = check_in(totalUserShifts);
            if (checked.length == 0)
            {
                alert("No shifts available to check in!");
                document.getElementById("IDswipeform").reset();
                document.getElementById("dvSchedule").innerHTML = "";
                return false;
            }
            for (var i = 0; i < checked.length; i++)
            {
                if(checked_shifts.indexOf(checked[i]) == -1)
                {
                    checked_shifts.push(checked[i]);
                }
            }
            display_shifts(checked, totalUserShifts);
            var int = setTimeout(function() 
            {
                document.getElementById("IDswipeform").reset();
                document.getElementById("dvSchedule").innerHTML = "";
            }, 5000);
        }
    }
    return false;
}

//Method to extract ID number from inputted message on html form.
function get_ID()
{
    var studentID;
    var input_string = document.forms["IDswipeform"]["IDbox"].value;
    if (input_string.length < 9)
    {
        alert("Not a valid ID number");
        return;
    } 
    if (input_string.indexOf("=") > -1 && input_string.charAt(0) == ";") 
    {
        var temp = input_string.substring(7,16);
        studentID = parseInt(temp);
    }
    else
    {
        if (input_string.charAt(0) == ";" && input_string.match(/^[0-9]+$/) != null && input_string.length == 9)
        {
            studentID = parseInt(input_string);
        }
        if (input_string.length == 9 && !isNaN(input_string))
        {
            studentID = input_string;
        }
        if (input_string.length > 9)
        {
            alert("Not a valid ID number")
            return;
        }
    }
    return studentID;
}

//Function that takes in an ambassador ID and finds all of their shifts
function get_shifts(IDnum)
{
	var tempShiftArr = [];
	for (var i = 0; i < shifts.length; i++)
	{
		if (shifts[i]["Employee ID"] == IDnum)
		{
			tempShiftArr.push(shifts[i]);
		}
	}
	return tempShiftArr;
}

//This function accepts an array of the user's total shifts and determines which of those shifts are current and consecutive
//Shifts with a difference of two or more hours in start time are not considered consecutive
// i.e. 8am shift and 10am shift are not consecutive, but 8am and 9am are
function check_in(shiftArr)
{
	var today = new Date();
	var currentHour = today.getHours();
    var currentMins = today.getMinutes();
    var k = 0;
    var i = 0;
    var curShifts = [];
    for (i; i < shiftArr.length; i++)
    {
        var tempShiftStart = shiftArr[i]["Start"];
        var tempHour = parseInt(tempShiftStart.substring(0, tempShiftStart.indexOf(':')));
        if (tempShiftStart.substring(tempShiftStart.length - 2, tempShiftStart.length) == "PM")
        {
            if (tempHour != 12)
            {
                tempHour += 12;
            }
        }
        if (tempShiftStart.substring(tempShiftStart.length - 2, tempShiftStart.length) == "AM" && tempHour == 12)
        {
            tempHour = 0;
        }
        if (curShifts.length == 0)
        {
            if (tempHour == currentHour && currentMins < 15)
            {
                curShifts.push(shiftArr[i]);
                i = -1;
            }
            if (tempHour - 1 == currentHour)
            {
                curShifts.push(shiftArr[i]);
                i = -1;
            }
            if (tempHour == 0 && currentHour == 23)
            {
                curShifts.push(shiftArr[i]);
                i = -1;
            }
        }
        else
        {
            var prevShiftStart = parseInt(curShifts[k]["Start"].substring(0, curShifts[k]["Start"].indexOf(":")));
            if (curShifts[k]["Start"].substring(curShifts[k]["Start"].length - 2, curShifts[k]["Start"].length) == "PM")
            {
                if (prevShiftStart != 12)
                {
                    prevShiftStart += 12;
                }
            }
            if (curShifts[k]["Start"].substring(curShifts[k]["Start"].length - 2, curShifts[k]["Start"].length) == "AM" && prevShiftStart == 12)
            {
                prevShiftStart = 0;
            }
            if (prevShiftStart + 1 == tempHour)
            {
                curShifts.push(shiftArr[i]);
                k++;
            }
        }
    }
    return curShifts;

}

//Function to display checked-in shifts as HTML elements
function display_shifts(currentShifts, totalShifts)
{
    var welcomeMsg = document.createElement("welcome");
    welcomeMsg.innerHTML = "Welcome " + currentShifts[0]["Employee"] + ", you are successfully checked in to the following shifts: ";
    document.getElementById("dvSchedule").appendChild(welcomeMsg);
    for (var i = 0; i < currentShifts.length; i++)
    {
        var newElement = document.createElement("P");
        newElement.innerHTML = currentShifts[i]["Start"] + " | " + currentShifts[i]["Position"] + " | " + currentShifts[i]["Site"];
        document.getElementById("dvSchedule").appendChild(newElement);
    }
}