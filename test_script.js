window.onload = function() {
	console.log("here");
  var teamNames = document.getElementsByClassName('teamName');
  var tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  var tableDataRows = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');
  // console.log(tableHeaders);
  // console.log(tableHeaders.length);
  for (var i = 0, l = tableHeaders.length; i < l; i++) {
    console.log(tableHeaders[i]);
    var child = document.createElement('th');
    child.classList.add("Table2__th");
    child.innerHTML = '<th title="" class="Table2__th"><div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div></th>';
    tableHeaders[i].appendChild(child);
  }

  for (var i = 0, l = tableDataRows.length; i < l; i++) {
    console.log(tableDataRows[i]);
    var child = document.createElement('th');
    child.classList.add("Table2__td");
    child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">--</div>';
    tableDataRows[i].appendChild(child);
  }
}

// <td class="Table2__td"><div title="Games Back" class="jsx-2810852873 table--cell fw-bold">--</div></td>

// <th title="" class="Table2__th"><div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div></th>
// // Checking page title
// if (document.title.indexOf("Google") != -1) {
//     //Creating Elements
//     var btn = document.createElement("BUTTON")
//     var t = document.createTextNode("CLICK ME");
//     btn.appendChild(t);
//     //Appending to DOM 
//     document.body.appendChild(btn);
// }