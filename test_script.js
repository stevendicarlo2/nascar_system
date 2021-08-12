if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

let nascarScoringDisplayer;

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
  
  let existingStandingsTable = document.querySelector(".final_standings_table");
  let shadowRoot = document.createElement("div");
  shadowRoot.classList.add("shadowRoot");
  existingStandingsTable.parentNode.insertBefore(shadowRoot, existingStandingsTable);
  shadowRoot.innerHTML = '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css">';  

  nascarScoringDisplayer = new NascarScoringDisplayer(shadowRoot);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "refreshDisplay") {
      nascarScoringDisplayer.refreshDisplay();
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
      window.tableContentsHash = document.querySelector(".Table__TBODY").innerHTML.hashCode();
      chrome.runtime.sendMessage({
        action: "loadScores",
        year: newYear
      });
    });
  }
}

onloadFunc();

