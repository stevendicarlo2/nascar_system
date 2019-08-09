function getCookies(domain, name, callback) {
  chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
    console.log(cookie);
    if(callback) {
      callback(cookie.value);
    }
  });
}
var tabID;

function openWorkerTab(year) {
  getCookies("https://fantasy.espn.com", "kona_v3_environment_season_ffl", function(value) {
      let cookieInfo = JSON.parse(value);
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
  console.log("here1");
  openWorkerTab();
}, {url: [{urlMatches : 'https://fantasy.espn.com/football/league/standings*'}]});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got a message");
    console.log(request);
    if (request.action === "openPage") {
      console.log("here2");
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




chrome.webNavigation.onCompleted.addListener(function() {

// 
// $.ajax({
//   url: 'https://nascar-scoring.firebaseio.com/scores/year/2019-20.json',
//   crossDomain: true,
//   success: function (info) {
//     // console.log(info);
//     // let info = JSON.parse(infoTextD);
//     let scores = {};
//     for (let weekNum in info) {
//       let week = info[weekNum];
//       let weekRank = [];
//       for (let owner in week) {
//         if (!(owner in scores)) {
//           scores[owner] = 0
//         }
//         weekRank.push({"name": owner, "points": week[owner]})
//       }
//       weekRank.sort(function(a, b) { return b.points-a.points });
//       // console.log(weekRank);
//       for (let i = 0; i < weekRank.length; i++) {
//         // console.log(scores[weekRank[i].name]);
//         scores[weekRank[i].name] += weekRank.length - i;
//       }
//       // console.log(JSON.stringify(scores));
//     }
//     chrome.storage.sync.set({"scores": scores}, function() {
//       console.log('Scores has been set to ' + JSON.stringify(scores));
//     });
//   },
//   error: function (error) {
//     console.log(error);
//   }
// });
// 
// $.ajax({
//   url: 'https://nascar-scoring.firebaseio.com/team_names.json',
//   crossDomain: true,
//   success: function (info) {
//     chrome.storage.sync.set({"names": info}, function() {
//       console.log('Names has been set to ' + JSON.stringify(info));
//     });
//   },
//   error: function (error) {
//     console.log(error);
//   }
// });

}, {url: [{urlMatches : 'https://fantasy.espn.com/football/league/standings*'}]});

