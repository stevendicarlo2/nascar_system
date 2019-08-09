
function openWorkerTab(year) {
  chrome.cookies.get({"url": "https://fantasy.espn.com", "name": "kona_v3_environment_season_ffl"}, function(cookie) {
      let cookieInfo = JSON.parse(cookie.value);
      let seasonId = (year) ? year : (cookieInfo["seasonId"] || 2019);
      let leagueId = cookieInfo["leagueId"];
      let scheduleURL = "https://fantasy.espn.com/football/league/schedule?leagueId=" + leagueId.toString() + "&seasonId=" + seasonId.toString();
      chrome.tabs.create({ url: scheduleURL, active: false }, function (tab) {
        tabID = tab.id;
        chrome.tabs.executeScript(tab.id, {
          file: "getScheduleData.js"
        });
      });
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(function() {
  openWorkerTab();
}, {url: [{urlMatches : 'https://fantasy.espn.com/football/league/standings*'}]});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "openPage") {
      openWorkerTab(request.year);
    }
    if (request.action === "getScores") {
      let scores = {};
      for (let weekNum in request.scores) {
        let week = request.scores[weekNum];
        let weekRank = [];
        for (let owner in week) {
          if (!(owner in scores)) {
            scores[owner] = 0
          }
          weekRank.push({"name": owner, "points": week[owner]})
        }
        weekRank.sort(function(a, b) { return b.points-a.points });
        // console.log(weekRank);
        for (let i = 0; i < weekRank.length; i++) {
          // console.log(scores[weekRank[i].name]);
          scores[weekRank[i].name] += weekRank.length - i;
        }
        // console.log(JSON.stringify(scores));
      }
      chrome.storage.sync.set({"scores": scores}, function() {
        console.log('Scores has been set to ' + JSON.stringify(scores));
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id,{ action: "refreshScores" });
        });
      });
      chrome.tabs.remove(tabID);
    }
  });



