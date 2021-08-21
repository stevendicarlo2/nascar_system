if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

function showNascarData() {
  console.log("starting showNascarData");
  if (document.querySelector(".shadowRoot")) {
    console.log("skipping showNascarData, UI already exists");
    return;
  }
  
  let existingStandingsTable = document.querySelector(".final_standings_table");
  let shadowRoot = document.createElement("div");
  shadowRoot.classList.add("shadowRoot");
  existingStandingsTable.parentNode.insertBefore(shadowRoot, existingStandingsTable);
  shadowRoot.innerHTML = '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css">';  

  window.nascarScoringDisplayer = new NascarScoringDisplayer(shadowRoot);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "refreshDisplay") {
      window.nascarScoringDisplayer.refreshDisplay();
    }
  }
);

async function waitUntilPageHTMLReady() {
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
  await waitUntilPageHTMLReady();
  showNascarData();
  
  let selector = document.querySelector("select.dropdown__select");
  if (selector.getAttribute("year-selector-change-listener") !== 'true') {
    selector.setAttribute("year-selector-change-listener", 'true');
    selector.addEventListener("change", function(e) {
      var newYear = e.target.value;
      chrome.runtime.sendMessage({
        action: "loadScores",
        year: newYear
      });
    });
  }
}

onloadFunc();

