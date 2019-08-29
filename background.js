
var tabID;

function loadScores(year) {
  chrome.cookies.get({"url": "https://fantasy.espn.com", "name": "kona_v3_environment_season_ffl"}, function(cookie) {
    let cookieInfo = JSON.parse(cookie.value);
    let seasonId = (year) ? year : (cookieInfo["seasonId"] || 2019);
    let leagueId = cookieInfo["leagueId"];
    
    console.log("in loadScores");
    chrome.storage.local.get("scoreData"+seasonId.toString(), function(result) {
      let shouldReloadData = Object.entries(result).length === 0;
      let currTime = new Date().getTime();
      let daysBetweenRefresh = 1;
      shouldReloadData = shouldReloadData || (currTime - result["scoreData"+seasonId.toString()].storedTime > daysBetweenRefresh*24*60*60*1000);
      // shouldReloadData = shouldReloadData || (currTime - result["scoreData"+seasonId.toString()].storedTime > 1*1000);
      if (shouldReloadData) {
        let scheduleURL = "https://fantasy.espn.com/football/league/schedule?leagueId=" + leagueId.toString() + "&seasonId=" + seasonId.toString();
        chrome.tabs.create({ url: scheduleURL, active: false }, function (tab) {
          tabID = tab.id;
          chrome.tabs.executeScript(tab.id, { code: "var seasonId = " + seasonId.toString() }, function() {
            chrome.tabs.executeScript(tab.id, { file: "getScheduleData.js" })
          });
        });
      } else {
        chrome.storage.local.set({"scoreData": result["scoreData"+seasonId.toString()]}, function() {
          console.log('scoreData has been set from stored data:');
          console.log(result);
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
      loadScores(request.year);
    }
    if (request.action === "processScores") {
      let scoreData = {"weekly_breakdown": request.scores, "totals": {}};
      for (let weekNum in request.scores) {
        let week = request.scores[weekNum];
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
          let nascar_points = weekRank.length - i;
          scoreData.weekly_breakdown[weekNum][weekRank[i].name].nascar_points = nascar_points;
          scoreData.totals[weekRank[i].name].total_NP += nascar_points;
          scoreData.totals[weekRank[i].name].wins += weekRank[i].wins;
        }
        // console.log(JSON.stringify(scores));
      }
      scoreData["storedTime"] = new Date().getTime();
      var info = {};
      info["scoreData" + request.year.toString()] = scoreData;
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
    }
  });

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (details.url.includes("https://fantasy.espn.com/football/league/standings")) {
    console.log("navigated to standings");
    chrome.tabs.executeScript(null,{file:"test_script.js"});
  }
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'fantasy.espn.com'},
      })
      ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

