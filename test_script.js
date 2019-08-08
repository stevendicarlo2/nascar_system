const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function showNascarData() {
	console.log("here");
  var teamNames = document.getElementsByClassName('teamName');
  var tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  if (tableHeaders.length === 0) {
    await sleep(500);
    tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  }
  for (var i = 0, l = tableHeaders.length; i < l; i++) {
    console.log(tableHeaders[i]);
    // console.log(tableHeaders[i].innerHTML);
    // if (tableHeaders[i].innerHTML.includes("NASCAR")) {
    //   console.log("here3");
    //   continue;
    // }
    var child = document.createElement('th');
    child.classList.add("Table2__th");
    child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div>';
    tableHeaders[i].appendChild(child);
    
    var child2 = document.createElement('th');
    child2.classList.add("Table2__th");
    child2.innerHTML = '<div title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell header"><span>ANP</span></div>';
    tableHeaders[i].appendChild(child2);
  }

  
  
  var tableDataRows = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');

  chrome.storage.sync.get(['scores'], function(scores) {
      // console.log('Value currently is ' + result.key);
      

    for (var i = 0, l = tableDataRows.length; i < l; i++) {
      var teamName = tableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
      var score = scores.scores[teamName] || 0;
      
      var winColumn = tableDataRows[i].getElementsByClassName("wins__column");
      var wins;
      if (winColumn.length === 0) {
        var recordColumn = tableDataRows[i].children[2]
        wins = recordColumn.children[0].innerHTML;
        wins = wins.substr(0, wins.indexOf('-'));
      } else {
        wins = winColumn[0].innerHTML;
      }
      
      let child = document.createElement('th');
      child.classList.add("Table2__td");
      child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + score.toString() + '</div>';
      tableDataRows[i].appendChild(child);
      
      let child2 = document.createElement('th');
      child2.classList.add("Table2__td");
      child2.innerHTML = '<div title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + (score + wins*7).toString() + '</div>';
      tableDataRows[i].appendChild(child2);

    }

  });
  var regularSeasonButton = document.getElementsByClassName("btn standings_page_regular_season");
  if (regularSeasonButton.length !== 0) {
    regularSeasonButton[0].addEventListener("click", showNascarData);
  }
  var finalStandingsButton = document.getElementsByClassName("btn standings_page_final_standings");
  if (finalStandingsButton.length !== 0) {
    finalStandingsButton[0].addEventListener("click", showNascarData);
  }
}

window.onload = showNascarData;


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


/*

window.onload = function() {
  // document.write("hello");
	console.log("here");
  // let tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  var tableHeaders = document.getElementsByClassName('Table2__header-row');
  console.log(tableHeaders);
  console.log(tableHeaders.length);
  for (var j = 0; j < tableHeaders.length; j++) {
    console.log("here2");
    console.log(tableHeaders[i]);
    var child = document.createElement('th');
    child.classList.add("Table2__th");
    child.innerHTML = '<th title="" class="Table2__th"><div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div></th>';
    tableHeaders[i].appendChild(child);
  }




  var tableDataRows = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');
  
  chrome.storage.sync.get(['scores'], function(scores) {
    chrome.storage.sync.get(['names'], function(names) {
      // console.log('Value currently is ' + result.key);
      

      for (let i = 0, l = tableDataRows.length; i < l; i++) {
        var teamName = tableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
        var owner = names.names[teamName.replace("  ", " ")];
        var score = scores.scores[owner] || 0;
        
        var wins = tableDataRows[i].getElementsByClassName("wins__column")[0].innerHTML;
        console.log(wins);
        
        let child = document.createElement('th');
        child.classList.add("Table2__td");
        child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + score.toString() + '</div>';
        tableDataRows[i].appendChild(child);
      }
    });

  });
  
  
  
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

*/
