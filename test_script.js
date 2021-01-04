if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

async function showNascarDataWhenReady() {
  await waitUntilHeaders();
  console.log("done waiting until headers");
  var newContents = document.querySelector(".Table__TBODY").innerHTML;
  var newContentsHash = newContents.hashCode();
  while (window.tableContentsHash == newContentsHash) {
    newContents = document.querySelector(".Table__TBODY").innerHTML;
    newContentsHash = newContents.hashCode();
    await window.sleep(500);
  }
  showNascarData();
}

function showNascarData() {
  console.log("starting showNascarData");
  let standingsTableTitleLabels = document.querySelectorAll(".Table__Title");
  let standingsTableCaptionLabels = document.querySelectorAll(".Table__Caption");
  let tables = [];
  console.log("got standingsTableLabels");
  console.log(standingsTableTitleLabels);
  console.log(standingsTableCaptionLabels);

  standingsTableTitleLabels.forEach(function(label) {
    let dataTable = label.parentNode.querySelector(".Table__Scroller .Table");
    if (label.textContent.includes("Season Stats")) {
      let nameTable = label.parentNode.querySelector(".Table--fixed");
      tables.push({"dataTable": dataTable, "isWeird": true, "nameTable": nameTable});
    } else {
      tables.push({"dataTable": dataTable, "isWeird": false});
    }
  });
  standingsTableCaptionLabels.forEach(function(label) {
    let dataTable = label.parentNode.parentNode.querySelector(".Table");
    if (label.textContent.includes("Season Stats")) {
      let nameTable = label.parentNode.querySelector(".Table--fixed");
      tables.push({"dataTable": dataTable, "isWeird": true, "nameTable": nameTable});
    } else {
      tables.push({"dataTable": dataTable, "isWeird": false});
    }
  });
  console.log("got tables");
  console.log(tables);
  tables.forEach(function(tableInfo) {
    let table = tableInfo.dataTable;
    let isWeird = tableInfo.isWeird;
    let tableHeaders;
    if (isWeird) {
      tableHeaders = table.getElementsByClassName("Table__sub-header Table__THEAD");
    } else {
      tableHeaders = table.getElementsByClassName('Table__TR Table__even');
    }
 
    for (var i = 0, l = tableHeaders.length; i < l; i++) {
      if (tableHeaders[i].innerHTML.includes("nascar-pts-ext")) {
        continue;
      }
      var child = document.createElement('th');
      child.classList.add("Table__TH", "nascar-pts-ext");
      child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div>';
      if (isWeird) {
        tableHeaders[i].firstChild.appendChild(child);
      } else {
        tableHeaders[i].appendChild(child);
      }
      
      var child2 = document.createElement('th');
      child2.classList.add("Table__TH", "nascar-pts-ext");
      child2.innerHTML = '<div title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell header"><span>ANP</span></div>';
      if (isWeird) {
        tableHeaders[i].firstChild.appendChild(child2);
      } else {
        tableHeaders[i].appendChild(child2);
      }
    }

    let tableDataRows;
    if (isWeird) {
      tableDataRows = table.getElementsByClassName("Table__TR Table__TR--md Table__even");
    } else {
      tableDataRows = table.getElementsByClassName('Table__TR Table__TR--md Table__odd');
    }
    chrome.storage.local.get(['scoreData', 'pointsPerWin'], function(storedData) {
      scoreData = storedData.scoreData;
      console.log(storedData);
      var pointsPerWin = (storedData.pointsPerWin !== undefined) ? storedData.pointsPerWin : 14;
      for (var i = 0, l = tableDataRows.length; i < l; i++) {
        var teamName;
        if (isWeird) {
          let nameTableDataRows = tableInfo.nameTable.getElementsByClassName("Table__TR Table__TR--md Table__even");
          teamName = nameTableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
        }  else {
          teamName = tableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
        }
        var score = (scoreData.totals[teamName])? scoreData.totals[teamName].total_NP : 0;
        var wins = (scoreData.totals[teamName])? scoreData.totals[teamName].wins : 0;
        var adj_score = score + wins*pointsPerWin;
        
        var NPChild = tableDataRows[i].querySelector("#NP"+i.toString())
        if (NPChild) {
          NPChild.innerHTML = score.toString();
        } else {
          let child = document.createElement('td');
          child.classList.add("Table__TD", "nascar-pts-ext");
          child.innerHTML = '<div id="NP'+i.toString()+'" title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + score.toString() + '</div>';
          tableDataRows[i].appendChild(child);
        }
        
        var ANPChild = tableDataRows[i].querySelector("#ANP"+i.toString())
        if (ANPChild) {
          ANPChild.innerHTML = adj_score.toString();
        } else {
          let child2 = document.createElement('td');
          child2.classList.add("Table__TD", "nascar-pts-ext");
          child2.innerHTML = '<div id="ANP'+i.toString()+'" title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + adj_score.toString() + '</div>';
          tableDataRows[i].appendChild(child2);
        }

      }
      createWeeklyBreakdownTable(scoreData, pointsPerWin);

    });
  });
  
  let table = document.querySelector(".Table__TBODY");
  if (!table.parentNode.parentNode.querySelector(".refreshScoresButton")) {
    let refreshButton = document.createElement('button');
    refreshButton.setAttribute("type", "button");
    refreshButton.classList.add("refreshScoresButton");
    refreshButton.innerHTML = "Refresh Score Data";
    refreshButton.addEventListener("click", function() {
      chrome.runtime.sendMessage({
        action: "loadScores",
        override: "true"
      });
    });
    table.parentNode.parentNode.appendChild(refreshButton);
  }
  
  var regularSeasonButton = document.querySelector(".btn.standings_page_regular_season");
  if (regularSeasonButton && regularSeasonButton.getAttribute("regular-season-button-listener") !== 'true') {
    regularSeasonButton.setAttribute("regular-season-button-listener", 'true');
    regularSeasonButton.addEventListener("click", function() {
      removeNascarData();
      window.tableContentsHash = document.querySelector(".Table__TBODY").innerHTML.hashCode();
      showNascarDataWhenReady();
    });
  }
  var finalStandingsButton = document.querySelector(".btn.standings_page_final_standings");
  if (finalStandingsButton && finalStandingsButton.getAttribute("final-standings-button-listener") !== 'true') {
    finalStandingsButton.setAttribute("final-standings-button-listener", 'true');
    finalStandingsButton.addEventListener("click", function() {
      removeNascarData();
      window.tableContentsHash = document.querySelector(".Table__TBODY").innerHTML.hashCode();
      showNascarDataWhenReady();
    });
  }
  var headers = document.getElementsByClassName("sortable");
  for (var i = 0; i<headers.length; i++) {
    if (headers[i].getAttribute("re-sort-listener") !== 'true') {
      headers[i].setAttribute("re-sort-listener", 'true');
      headers[i].addEventListener("click", function() {
        showNascarData();
      });
    }
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "refreshDisplay") {
      showNascarDataWhenReady();
    }
  }
);

async function waitUntilHeaders() {
  var headers = document.getElementsByClassName('Table__TR Table__TR--md Table__odd');
  while (headers.length === 0) {
    await window.sleep(500);
    console.log("checking for headers again");
    headers = document.getElementsByClassName('Table__TR Table__TR--md Table__odd');
  }
  return;
}

function removeNascarData() {
  var nascarData = document.getElementsByClassName('nascar-pts-ext');
  while (nascarData.length > 0) {
    var element = nascarData[nascarData.length - 1];
    // console.log(element);
    element.parentNode.removeChild(element);
  }
  // console.log("nascar data removed");
}

async function onloadFunc() {
  console.log("in test script onloadFunc");
  var selector = document.querySelector("select.dropdown__select");
  while (!selector) {
    await window.sleep(500);
    selector = document.querySelector("select.dropdown__select");
  }
  await showNascarDataWhenReady();

  if (selector.getAttribute("year-selector-change-listener") !== 'true') {
    selector.setAttribute("year-selector-change-listener", 'true');
    selector.addEventListener("change", function(e) {
      var newYear = e.target.value;
      removeNascarData();
      window.tableContentsHash = document.querySelector(".Table__TBODY").innerHTML.hashCode();
      chrome.runtime.sendMessage({
        action: "loadScores",
        year: newYear
      });
    });
  }
}

onloadFunc();

