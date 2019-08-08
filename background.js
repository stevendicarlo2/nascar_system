chrome.webNavigation.onCompleted.addListener(function() {


$.ajax({
  url: 'https://nascar-scoring.firebaseio.com/scores/year/2019-20.json',
  crossDomain: true,
  success: function (info) {
    // console.log(info);
    // let info = JSON.parse(infoTextD);
    let scores = {};
    for (let weekNum in info) {
      let week = info[weekNum];
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
    });
  },
  error: function (error) {
    console.log(error);
  }
});

$.ajax({
  url: 'https://nascar-scoring.firebaseio.com/team_names.json',
  crossDomain: true,
  success: function (info) {
    chrome.storage.sync.set({"names": info}, function() {
      console.log('Names has been set to ' + JSON.stringify(info));
    });
  },
  error: function (error) {
    console.log(error);
  }
});

}, {url: [{urlMatches : 'https://fantasy.espn.com/football/league/standings*'}]});

