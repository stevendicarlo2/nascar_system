const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function showNascarData() {
  var teamNames = document.getElementsByClassName('teamName');
  await sleep(10);
  var tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  if (tableHeaders.length === 0) {
    await sleep(500);
    tableHeaders = document.getElementsByClassName('Table2__header-row Table2__tr Table2__even');
  }
  for (var i = 0, l = tableHeaders.length; i < l; i++) {
    // console.log(tableHeaders[i]);
    // console.log(tableHeaders[i].innerHTML);
    if (tableHeaders[i].innerHTML.includes("NASCAR")) {
      continue;
    }
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
      
      var NPChild = tableDataRows[i].querySelector("#NP"+i.toString())
      if (NPChild) {
        NPChild.innerHTML = score.toString();
      } else {
        let child = document.createElement('th');
        child.classList.add("Table2__td");
        child.innerHTML = '<div id="NP'+i.toString()+'" title="NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + score.toString() + '</div>';
        tableDataRows[i].appendChild(child);
      }
      
      var ANPChild = tableDataRows[i].querySelector("#ANP"+i.toString())
      if (ANPChild) {
        ANPChild.innerHTML = (score + wins*7).toString();
      } else {
        let child2 = document.createElement('th');
        child2.classList.add("Table2__td");
        child2.innerHTML = '<div id="ANP'+i.toString()+'" title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + (score + wins*7).toString() + '</div>';
        tableDataRows[i].appendChild(child2);
      }

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
  var headers = document.getElementsByClassName("sortable");
  for (var i = 0; i<headers.length; i++) {
    headers[i].addEventListener("click", function() {
      showNascarData();
    });
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "refreshScores") {
      showNascarData();
    }
  });

async function onloadFunc() {
  var selector = document.querySelector("select.dropdown__select");
  while (!selector) {
    // console.log("no selector yet");
    await sleep(500);
    selector = document.querySelector("select.dropdown__select");
  }

  selector.addEventListener("change", function(e) {
    var newYear = e.target.value;
    chrome.runtime.sendMessage({
      action: "openPage",
      year: newYear
    });
  });
  document.getElementsByClassName("standings NavSecondary__Item")[0].addEventListener("click", function() {
    chrome.runtime.sendMessage({
      action: "openPage"
    });
  });
}

window.onload = onloadFunc;


