
var tabID;

function getAdjustedScores(adjustments, scoreData) {
  for (let week in adjustments) {
    for (let team in adjustments[week]) {
      let value = parseFloat(adjustments[week][team]);
      if (week in scoreData) {
        if (team in scoreData[week]) {
          scoreData[week][team].score += value;
        }
      }
    }
  }
  scoreData["storedTime"] = new Date().getTime();
  return scoreData;
}

function processScores(rawData) {
  let scoreData = {"weekly_breakdown": rawData, "totals": {}};
  for (let weekNum in rawData) {
    let week = rawData[weekNum];
    let weekRank = [];
    for (let owner in week) {
      if (!(owner in scoreData.totals)) {
        scoreData.totals[owner] = {"total_NP": 0, "wins": 0};
      }
      weekRank.push({"name": owner, "score": week[owner].score, "wins": week[owner].wins})
    }
    weekRank.sort(function(a, b) { return b.score-a.score });
    // console.log(weekRank);
    for (let i = 0; i < weekRank.length; i++) {
      // console.log(scores[weekRank[i].name]);
      let score = weekRank[i].score;
      let numTeams = 0;
      let accumPoints = 0.0;
      for (let j = 0; j < weekRank.length; j++) {
        if (weekRank[j].score === score) {
          numTeams += 1;
          accumPoints += weekRank.length - j;
        }
      }
      let nascar_points = accumPoints / numTeams;
      scoreData.weekly_breakdown[weekNum][weekRank[i].name].nascar_points = nascar_points;
      scoreData.totals[weekRank[i].name].total_NP += nascar_points;
      scoreData.totals[weekRank[i].name].wins += weekRank[i].wins;
    }
    // console.log(JSON.stringify(scores));
  }
  return scoreData;
}

function loadScores(year, override) {
  chrome.cookies.get({"url": "https://fantasy.espn.com", "name": "kona_v3_teamcontrol_ffl"}, function(cookie) {
    let cookieInfo = JSON.parse(cookie.value);
    let seasonId = (year) ? year : (cookieInfo["seasonId"] || 2020);
    console.log("seasonId: " + cookieInfo["seasonId"]);
    console.log("cookieInfo:");
    console.log(cookieInfo);
    let leagueId = cookieInfo["leagueId"];
    
    console.log("in loadScores");
    chrome.storage.local.get(["scoreData"+seasonId.toString(), "adjustments"], function(result) {
      let adjustments = result.adjustments || {};
      adjustments = adjustments[seasonId.toString()] || {};
      let scoreData = result["scoreData"+seasonId.toString()];

      let shouldReloadData = !scoreData;
      let currTime = new Date().getTime();
      let daysBetweenRefresh = 1;
      shouldReloadData = shouldReloadData || (currTime - scoreData.storedTime > daysBetweenRefresh*24*60*60*1000);
      // shouldReloadData = shouldReloadData || (currTime - scoreData.storedTime > 1*1000);
      shouldReloadData = shouldReloadData || override;
      if (shouldReloadData) {
        let scheduleURL = "https://fantasy.espn.com/football/league/schedule?leagueId=" + leagueId.toString() + "&seasonId=" + seasonId.toString();
        chrome.tabs.create({ url: scheduleURL, active: false }, function (tab) {
          tabID = tab.id;
          console.log("seasonID: " + seasonId.toString());
          chrome.tabs.executeScript(tab.id, { code: "var seasonId = " + seasonId.toString() }, function() {
            chrome.tabs.executeScript(tab.id, { file: "getScheduleData.js" })
          });
        });
      } else {
        let adjustedScores = getAdjustedScores(adjustments, scoreData);
        let processedData = processScores(adjustedScores);
        chrome.storage.local.set({"scoreData": processedData}, function() {
          console.log('scoreData has been set from stored data:');
          console.log(processedData);
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,{ action: "refreshDisplay" });
          });
        });
      }
    });
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(function() {
  loadScores();
}, {url: [{urlMatches : 'https://fantasy.espn.com/football/league/standings*'}]});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "loadScores") {
      let override = request.override === "true";
      loadScores(request.year, override);
    }
    if (request.action === "processScores") {
      chrome.storage.local.get(["adjustments"], function(result) {
        let adjustments = result.adjustments || {};
        adjustments = adjustments[request.year] || {};
        let adjustedScores = getAdjustedScores(adjustments, request.scores);
        let scoreData = processScores(adjustedScores);
        var info = {};
        info["scoreData" + request.year.toString()] = adjustedScores;
        chrome.storage.local.set(info, function() {
          chrome.storage.local.set({"scoreData": scoreData}, function() {
            console.log('scoreData has been set from scraping page:');
            console.log(scoreData);
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id,{ action: "refreshDisplay" });
            });
          });
        });
        chrome.tabs.remove(tabID);
      });
    }
  });

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (details.url.includes("https://fantasy.espn.com/football/league/standings")) {
    console.log("navigated to standings");
    chrome.tabs.executeScript(null,{file:"test_script.js"});
  }
});
