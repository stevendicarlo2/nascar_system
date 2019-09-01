function displayExistingAdjustments() {
  chrome.storage.local.get(['adjustments'], function(result) {
    let adjustments = result.adjustments;
    if (!adjustments) {
      return;
    }
    let existingAdjustments = document.getElementById("existingAdjustments");
    while (existingAdjustments.firstChild) {
      existingAdjustments.removeChild(existingAdjustments.firstChild);
    }
    for (let year in adjustments) {
      for (let week in adjustments[year]) {
        for (let team in adjustments[year][week]) {
          let value = adjustments[year][week][team];
          let existing = document.createElement("p");
          existing.innerHTML = year + " season, week " + (parseInt(week)+1).toString() + ", " + team + ": " + value + " points";
          existingAdjustments.appendChild(existing);
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function(){

displayExistingAdjustments();
 
chrome.storage.local.get(['pointsPerWin'], function(pointsPerWin) {
  var defaultPoints = (pointsPerWin.pointsPerWin !== undefined) ? pointsPerWin.pointsPerWin : 14;
  document.getElementById("winValue").value = defaultPoints;
});

chrome.storage.local.get(null, function(storageResults) {
  let adjustments = {};
  if ("adjustments" in storageResults) {
    adjustments = storageResults["adjustments"];
  }
  console.log(storageResults);
  for (let resultName in storageResults) {
    if (resultName.includes("scoreData") && resultName !== "scoreData") {
      let year = resultName.substring(resultName.length-4, resultName.length);
      if (!(year in adjustments)) {
        adjustments[year] = {}
      }
    }
  }
  for (let year in adjustments) {
    let yearSelector = document.getElementById("yearSelector");
    let option = document.createElement('option');
    option.setAttribute("value", year);
    option.innerHTML = year;
    yearSelector.appendChild(option);
  }
  chrome.storage.local.set({"adjustments": adjustments});
});

document.getElementById("winValueForm").addEventListener("submit", function(e) {
  e.preventDefault();
  let points = document.getElementById("winValue").value;
  let pointsNum = parseInt(points);
  chrome.storage.local.set({"pointsPerWin": pointsNum}, function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id,{ action: "refreshDisplay" });
    });
  });
});

document.getElementById("yearSelector").addEventListener("change", function(e) {
  console.log(e);
  let year = e.target.value;
  let weekSelector = document.getElementById("weekSelector");
  let teamSelector = document.getElementById("teamSelector");
  while (weekSelector.firstChild) {
    weekSelector.removeChild(weekSelector.firstChild);
  }
  while (teamSelector.firstChild) {
    teamSelector.removeChild(teamSelector.firstChild);
  }
  let defaultOption = document.createElement('option');
  defaultOption.setAttribute("selected", "");
  defaultOption.setAttribute("disabled", "");
  weekSelector.appendChild(defaultOption);
  let defaultOption2 = document.createElement('option');
  defaultOption2.setAttribute("selected", "");
  defaultOption2.setAttribute("disabled", "");
  teamSelector.appendChild(defaultOption2);
  
  chrome.storage.local.get(['scoreData' + year], function(result) {
    let scoreData = result['scoreData' + year] || {};
    console.log(scoreData);
    let includedTeams = [];
    for (let week in scoreData) {
      if (week === "storedTime") {
        continue;
      }
      let option = document.createElement('option');
      option.setAttribute("value", week);
      option.innerHTML = (parseInt(week) + 1).toString();
      weekSelector.appendChild(option);
      for (let team in scoreData[week]) {
        console.log(team);
        console.log(includedTeams);
        if (!includedTeams.includes(team)) {
          console.log("here");
          let option = document.createElement('option');
          option.setAttribute("value", team);
          option.innerHTML = team;
          teamSelector.appendChild(option);
          includedTeams.push(team);
        }
      }
    }
  });
});

document.getElementById("adjustmentForm").addEventListener("submit", function(e) {
  e.preventDefault();
  let year = document.getElementById("yearSelector").value;
  let week = document.getElementById("weekSelector").value;
  let team = document.getElementById("teamSelector").value;
  let score_adjustment = document.getElementById("adjustmentValue").value;
  console.log(year + week + team);
  if (!year || !week || !team) {
    document.getElementById("adjustmentFormError").style.display = "inline";
    return;
  }
  
  document.getElementById("adjustmentFormError").style.display = "none";

  chrome.storage.local.get(['adjustments'], function(result) {
    let adjustments = result.adjustments;
    if (!(year in adjustments)) {
      adjustments[year] = {};
    }
    if (!(week in adjustments[year])) {
      adjustments[year][week] = {};
    }
    if (score_adjustment === "0") {
      delete adjustments[year][week][team];
    } else {
      adjustments[year][week][team] = score_adjustment;
    }
    chrome.storage.local.set({"adjustments": adjustments}, function() {
      displayExistingAdjustments();
      chrome.runtime.sendMessage({
        action: "loadScores"
      });
    });
  });
  
});

});
