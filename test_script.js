const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}


var tableContents = "";

async function showNascarDataWhenReady() {
  await waitUntilHeaders();
  var newContents = document.querySelector(".Table2__tbody").innerHTML;
  while (tableContents == newContents) {
    console.log("table contents is still " + newContents + ", couldn't show new data");
    newContents = document.querySelector(".Table2__tbody").innerHTML;
    await sleep(500);
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

  chrome.storage.local.get(['scoreData'], function(scoreData) {
    // console.log('Value currently is ' + result.key);
      
    scoreData = scoreData.scoreData;
    console.log(scoreData);
    for (var i = 0, l = tableDataRows.length; i < l; i++) {
      var teamName = tableDataRows[i].getElementsByClassName("teamName truncate")[0].getAttribute("title");
      var score = (scoreData.totals[teamName])? scoreData.totals[teamName].total_NP : 0;
      var wins = (scoreData.totals[teamName])? scoreData.totals[teamName].wins : 0;
      var wins_multiplier = 7;
      var adj_score = score + wins*wins_multiplier;
      
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
        ANPChild.innerHTML = (score + wins*7).toString();
      } else {
        let child2 = document.createElement('th');
        child2.classList.add("Table2__td", "nascar-pts-ext");
        child2.innerHTML = '<div id="ANP'+i.toString()+'" title="Adjusted NASCAR Points" class="jsx-2810852873 table--cell fw-bold">' + adj_score.toString() + '</div>';
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
    if (request.action === "refreshDisplay") {
      showNascarDataWhenReady();
    }
  });

async function waitUntilHeaders() {
  var headers = document.getElementsByClassName('Table2__tr Table2__tr--md Table2__odd');
  while (headers.length === 0) {
    await sleep(500);
    console.log("headers don't exist yet");
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
  var selector = document.querySelector("select.dropdown__select");
  while (!selector) {
    // console.log("no selector yet");
    await sleep(500);
    selector = document.querySelector("select.dropdown__select");
  }
  await showNascarDataWhenReady();

  selector.addEventListener("change", function(e) {
    var newYear = e.target.value;
    removeNascarData();
    tableContents = document.querySelector(".Table2__tbody").innerHTML;
    chrome.runtime.sendMessage({
      action: "loadScores",
      year: newYear
    });
  });
  document.getElementsByClassName("standings NavSecondary__Item")[0].addEventListener("click", function() {
    tableContents = document.querySelector(".Table2__tbody").innerHTML;
    chrome.runtime.sendMessage({
      action: "loadScores"
    });
  });
}

window.onload = onloadFunc;


