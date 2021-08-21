
var tabID;

function getAdjustedScores(adjustments, weeklyBreakdownInfo) {
  for (let week in adjustments) {
    for (let team in adjustments[week]) {
      let value = parseFloat(adjustments[week][team]);
      if (week in weeklyBreakdownInfo) {
        if (team in weeklyBreakdownInfo[week]) {
          weeklyBreakdownInfo[week][team].score += value;
        }
      }
    }
  }
  weeklyBreakdownInfo["storedTime"] = new Date().getTime();
  return weeklyBreakdownInfo;
}

function processScores(rawData) {
  let scoreData = {"weekly_breakdown": rawData, "totals": {}};
  for (let weekNum in rawData) {
    let week = rawData[weekNum];
    
    // This is a list of entries containing each team's info for the week, 
    // which will be sorted by points scored
    let weekRank = [];
    for (let owner in week) {
      if (!(owner in scoreData.totals)) {
        scoreData.totals[owner] = {"total_NP": 0, "wins": 0};
      }
      weekRank.push({"name": owner, "score": week[owner].score, "wins": week[owner].wins})
    }
    weekRank.sort(function(a, b) { return b.score-a.score });
    // console.log(weekRank);
    
    // For each entry in the sorted list, calculate the nascar points,
    // and add the data to the weekly breakdown and totals list
    for (let i = 0; i < weekRank.length; i++) {
      let score = weekRank[i].score;
      
      // Using the position in the array isn't quite good enough, because teams that tie
      // need to share the nascar points earned.
      // numTeams = the number of teams that share the same score
      // accumPoints = the number of accumulated nascar points the tying teams earned
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
    
    // Now that all the NP have been calculated, insert that info into the opponent's entry as well
    let weeklyBreakdownInfo = scoreData.weekly_breakdown[weekNum];
    for (let teamName in weeklyBreakdownInfo) {
      let opponentName = weeklyBreakdownInfo[teamName].oppName;
      let opponentNP = weeklyBreakdownInfo[opponentName].nascar_points;
      weeklyBreakdownInfo[teamName].oppNP = opponentNP;
    }
    // console.log(JSON.stringify(scores));
  }
  return scoreData;
}

function loadScores(year, override) {
  chrome.cookies.get({"url": "https://fantasy.espn.com", "name": "kona_v3_environment_season_ffl"}, function(cookie) {
    let cookieInfo = JSON.parse(cookie.value);
    let seasonId = (year) ? year : (cookieInfo["seasonId"] || 2020);
    console.log("seasonId: " + seasonId);
    console.log("cookieInfo:");
    console.log(cookieInfo);
    let leagueId = cookieInfo["leagueId"];
    
    console.log("in loadScores");
    chrome.storage.local.get(["weeklyBreakdownInfo"+seasonId.toString(), "adjustments"], function(result) {
      let adjustments = result.adjustments || {};
      adjustments = adjustments[seasonId.toString()] || {};
      let scoreData = result["weeklyBreakdownInfo"+seasonId.toString()];

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
            chrome.tabs.executeScript(tab.id, { file: "core/getScheduleData.js" })
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
        let adjustedScores = getAdjustedScores(adjustments, request.weeklyBreakdownInfo);
        let scoreData = processScores(adjustedScores);
        var info = {};
        info["weeklyBreakdownInfo" + request.year.toString()] = adjustedScores;
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
    chrome.tabs.executeScript(null,{file:"core/test_script.js"});
  }
});
