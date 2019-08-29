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
    console.log(scoreData);
    var pointsPerWin = storedData.pointsPerWin;
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

  });
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

