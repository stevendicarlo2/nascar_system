if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

function removeWeeklyBreakdownTable() {
  let existingTable = document.querySelector(".tableRoot");
  if (existingTable) {
    existingTable.parentNode.removeChild(existingTable);
  }
}

function createWeeklyBreakdownTable(scoreData, pointsPerWin) {
  removeWeeklyBreakdownTable();
  let doubleTableBase = document.querySelector(".h2hTables");
  let base;
  if (doubleTableBase) {
    base = doubleTableBase;
  } else {
    let defaultTable = document.querySelector(".Table2__tbody");
    base = defaultTable.parentNode.parentNode;
  }
  // let shadowHost = document.createElement("div");
  // shadowHost.id = "shadowHost";
  // base.appendChild(shadowHost);
  // let shadowRoot = shadowHost.attachShadow({ mode: "open"});
  let shadowRoot = document.createElement("div");
  shadowRoot.classList.add("tableRoot");
  base.appendChild(shadowRoot);
  shadowRoot.innerHTML = '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css">';
  // shadowRoot.innerHTML += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">';
  // shadowRoot.innerHTML += '<link href="datatables/mdb.min.css" rel="stylesheet">';
  // shadowRoot.innerHTML += '<link href="datatables/datatables.min.css" rel="stylesheet">';
  
  // shadowRoot.innerHTML += '<script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min.js"></script>';
  shadowRoot.innerHTML += '<script type="text/javascript" src="datatables/jquery-3.4.1.min.js"></script>';
  shadowRoot.innerHTML += '<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>';
  shadowRoot.innerHTML += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>';
  shadowRoot.innerHTML += '<script type="text/javascript" src="datatables/mdb.min.js"></script>';
  shadowRoot.innerHTML += '<script type="text/javascript" src="datatables/datatables.min.js"></script>';
  
  let container = document.createElement("div");
  container.classList.add("myDataTable");
  shadowRoot.appendChild(container);
  let table = document.createElement("table");
  table.classList.add("table", "table-bordered", "table-sm");
  table.id = "weekly_breakdown_table";
  container.appendChild(table);
  let thead = document.createElement("thead");
  table.appendChild(thead);
  let headRow = document.createElement("tr");
  thead.appendChild(headRow);
  let ownerCol = document.createElement("th");
  ownerCol.classList.add("th-sm");
  ownerCol.innerHTML = "Team";
  headRow.appendChild(ownerCol);
  let totalCol = document.createElement("th");
  totalCol.classList.add("th-sm");
  totalCol.innerHTML = "Total NP";
  headRow.appendChild(totalCol);
  let adjCol = document.createElement("th");
  adjCol.classList.add("th-sm");
  adjCol.innerHTML = "Total ANP";
  headRow.appendChild(adjCol);
  for (let week in scoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    let weekCol = document.createElement("th");
    weekCol.classList.add("th-sm");
    weekCol.innerHTML = "Week " + (parseInt(week) + 1).toString();
    headRow.appendChild(weekCol);
  }

  // Filling with data
  let tbody = document.createElement("tbody");
  table.appendChild(tbody);
  for (let team in scoreData.totals) {
    let row = document.createElement("tr");
    let nameEntry = document.createElement("td");
    nameEntry.classList.add("teamName");
    nameEntry.innerHTML = team;
    row.appendChild(nameEntry);
    let totEntry = document.createElement("td");
    totEntry.classList.add("NP_data");
    totEntry.innerHTML = "<b>" + scoreData.totals[team].total_NP + "</b>";
    row.appendChild(totEntry);
    let adjEntry = document.createElement("td");
    adjEntry.classList.add("ANP_data");
    adjEntry.innerHTML = "<b>" + (scoreData.totals[team].total_NP + scoreData.totals[team].wins*pointsPerWin) + "</b>";
    row.appendChild(adjEntry);
    tbody.appendChild(row);
    for (let week in scoreData.weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      let info = scoreData.weekly_breakdown[week][team];
      let entry = document.createElement("td");
      entry.setAttribute("nascar-points", info.nascar_points + info.wins*pointsPerWin);
      entry.setAttribute("raw-points", info.score);
      entry.setAttribute("wins", info.wins);
      row.appendChild(entry);
    }
  }
  shadowRoot.innerHTML += '<label id="scoreTypeSwitchLabel" for="scoreTypeSwitch">Nascar Points</label><label class="switch"><input id="scoreTypeSwitch" type="checkbox" checked><span class="slider round"></span></label>';
  

  $(document).ready(function () {
    fillTableWithData(true);
    if ($.fn.dataTable.isDataTable('#weekly_breakdown_table')) {
      $('#weekly_breakdown_table').DataTable();
    } else {
      $('#weekly_breakdown_table').DataTable({
        "searching": false,
        "paging": false,
        "order": [[ 2, "desc" ]]
      });
    }
    $('.dataTables_length').addClass('bs-select');
    $('#weekly_breakdown_table').parent().addClass('freezeTable');
    var freezeTable = new FreezeTable('.freezeTable', {"columnNum": 3, "columnWrapStyles": {'border-right': '3px solid black'}});
    $('#weekly_breakdown_table th').click(function() {
      freezeTable.update();
    });
    $("#scoreTypeSwitch").click(function() {
      $("#scoreTypeSwitchLabel").html(this.checked ? "Nascar Points" : "Weekly Score");
      fillTableWithData(this.checked);
      freezeTable.update();
    });
  });
}

function fillTableWithData(useNascarPoints) {
  $(document).ready(function () {
    $("#weekly_breakdown_table td").each(function(i) {
      if (!(this.classList.contains("NP_data") || this.classList.contains("ANP_data") || this.classList.contains("teamName"))) {
        if (useNascarPoints) {
          this.innerHTML = this.getAttribute("nascar-points");
        } else {
          this.innerHTML = this.getAttribute("raw-points");
        }
        if (this.getAttribute("wins") === "1") {
          this.innerHTML = "<u>" + this.innerHTML + "</u>";
        }
      }
    });
    highlightTable();
  });
}

function highlightTable() {
  let minScore, minNP, minANP, minWeekScore;
  let maxScore=0, maxNP=0, maxANP=0, maxWeekScore=0;

  d3.selectAll("#weekly_breakdown_table td").each(function(d, i) {
    if (this.classList.contains("NP_data")) {
      let nascarPoints = parseFloat(this.textContent);
      if (minNP === undefined) {
        minNP = nascarPoints;
      } else {
        minNP = (nascarPoints < minNP) ? nascarPoints : minNP;
      }
      maxNP = (nascarPoints > maxNP) ? nascarPoints : maxNP;
    } else if (this.classList.contains("ANP_data")) {
      let adjNascarPoints = parseFloat(this.textContent);
      if (minANP === undefined) {
        minANP = adjNascarPoints;
      } else {
        minANP = (adjNascarPoints < minANP) ? adjNascarPoints : minANP;
      }
      maxANP = (adjNascarPoints > maxANP) ? adjNascarPoints : maxANP;
    } else if (!this.classList.contains("teamName")) {
      let nascarPoints = parseFloat(this.getAttribute("nascar-points"));
      let rawPoints = parseFloat(this.getAttribute("raw-points"));
      if (minScore === undefined) {
        minScore = rawPoints;
      } else {
        minScore = (rawPoints < minScore) ? rawPoints : minScore;
      }
      maxScore = (rawPoints > maxScore) ? rawPoints : maxScore;

      if (minWeekScore === undefined) {
        minWeekScore = nascarPoints;
      } else {
        minWeekScore = (nascarPoints < minWeekScore) ? nascarPoints : minWeekScore;
      }
      maxWeekScore = (nascarPoints > maxWeekScore) ? nascarPoints : maxWeekScore;
    }
  });

  let badColor = "#fe7575";
  let mediumColor = "#ffff88";
  let goodColor = "#64a764";
  let colorScale = d3.scaleLinear()
  .domain([1, (maxWeekScore+1)/2, maxWeekScore])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleNP = d3.scaleLinear()
  .domain([minNP, (minNP + maxNP)/2, maxNP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleANP = d3.scaleLinear()
  .domain([minANP, (minANP+maxANP)/2, maxANP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleRaw = d3.scaleLinear()
  .domain([minScore, (minScore+maxScore)/2, maxScore])
  .range([badColor, mediumColor, goodColor]);

  d3.selectAll("#weekly_breakdown_table td").each(function(d, i) {
    let value = parseFloat(this.textContent);
    let color;
    if (this.classList.contains("NP_data")) {
      color = colorScaleNP(value);
    } else if (this.classList.contains("ANP_data")) {
      color = colorScaleANP(value);
    } else if (!this.classList.contains("teamName")) {
      if ($("#scoreTypeSwitch").is(":checked")) {
        color = colorScale(value);
      } else {
        console.log(value);
        color = colorScaleRaw(value);
      }
    }
    this.style.backgroundColor = color;
  });
}

async function showNascarDataWhenReady() {
  await waitUntilHeaders();
  var newContents = document.querySelector(".Table2__tbody").innerHTML;
  var newContentsHash = newContents.hashCode();
  while (window.tableContentsHash == newContentsHash) {
    newContents = document.querySelector(".Table2__tbody").innerHTML;
    newContentsHash = newContents.hashCode();
    await window.sleep(500);
  }
  showNascarData();
}

function showNascarData() {
  console.log("starting showNascarData");
  var tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  for (var i = 0, l = tableHeaders.length; i < l; i++) {
    // console.log(tableHeaders[i]);
    // console.log(tableHeaders[i].innerHTML);
    if (tableHeaders[i].innerHTML.includes("nascar-pts-ext")) {
      continue;
    }
    var child = document.createElement('th');
    child.classList.add("Table2__th", "nascar-pts-ext");
    child.innerHTML = '<div title="NASCAR Points" class="jsx-2810852873 table--cell header"><span>NP</span></div>';
    tableHeaders[i].appendChild(child);
    
    var child2 = document.createElement('th');
    child2.classList.add("Table2__th", "nascar-pts-ext");
    child2.innerHTML = '<div title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell header"><span>ANP</span></div>';
    tableHeaders[i].appendChild(child2);
  }

  
  
  var tableDataRows = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');

  chrome.storage.local.get(['scoreData', 'pointsPerWin'], function(storedData) {
    // console.log('Value currently is ' + result.key);
      
    scoreData = storedData.scoreData;
    console.log(storedData);
    var pointsPerWin = (storedData.pointsPerWin !== undefined) ? storedData.pointsPerWin : 14;
    for (var i = 0, l = tableDataRows.length; i < l; i++) {
      var teamName = tableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
      var score = (scoreData.totals[teamName])? scoreData.totals[teamName].total_NP : 0;
      var wins = (scoreData.totals[teamName])? scoreData.totals[teamName].wins : 0;
      var adj_score = score + wins*pointsPerWin;
      
      var NPChild = tableDataRows[i].querySelector("#NP"+i.toString())
      if (NPChild) {
        NPChild.innerHTML = score.toString();
      } else {
        let child = document.createElement('th');
        child.classList.add("Table2__td", "nascar-pts-ext");
        child.innerHTML = '<div id="NP'+i.toString()+'" title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + score.toString() + '</div>';
        tableDataRows[i].appendChild(child);
      }
      
      var ANPChild = tableDataRows[i].querySelector("#ANP"+i.toString())
      if (ANPChild) {
        ANPChild.innerHTML = adj_score.toString();
      } else {
        let child2 = document.createElement('th');
        child2.classList.add("Table2__td", "nascar-pts-ext");
        child2.innerHTML = '<div id="ANP'+i.toString()+'" title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + adj_score.toString() + '</div>';
        tableDataRows[i].appendChild(child2);
      }

    }
    createWeeklyBreakdownTable(scoreData, pointsPerWin);

  });
  
  let table = document.querySelector(".Table2__tbody");
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
  if (regularSeasonButton.getAttribute("regular-season-button-listener") !== 'true') {
    regularSeasonButton.setAttribute("regular-season-button-listener", 'true');
    regularSeasonButton.addEventListener("click", function() {
      removeNascarData();
      window.tableContentsHash = document.querySelector(".Table2__tbody").innerHTML.hashCode();
      showNascarDataWhenReady();
    });
  }
  var finalStandingsButton = document.querySelector(".btn.standings_page_final_standings");
  if (finalStandingsButton.getAttribute("final-standings-button-listener") !== 'true') {
    finalStandingsButton.setAttribute("final-standings-button-listener", 'true');
    finalStandingsButton.addEventListener("click", function() {
      removeNascarData();
      window.tableContentsHash = document.querySelector(".Table2__tbody").innerHTML.hashCode();
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
  var headers = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');
  while (headers.length === 0) {
    await window.sleep(500);
    headers = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');
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
      window.tableContentsHash = document.querySelector(".Table2__tbody").innerHTML.hashCode();
      chrome.runtime.sendMessage({
        action: "loadScores",
        year: newYear
      });
    });
  }
}

onloadFunc();

