const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function getData() {
  console.log("from the schedule page");
  var weeks = document.getElementsByClassName("matchup--table");
  if (weeks.length === 0) {
    console.log("weeks was empty");
    await sleep(500);
    weeks = document.getElementsByClassName("matchup--table");
  }
  var scoreData = {}
  for (var i=0; i<weeks.length; i++) {
    var week = weeks[i];
    var weekName = week.getElementsByClassName("table-caption dib")[0].innerHTML;
    if (weekName.includes("Playoff")) {
      continue;
    }
    // console.log(week);
    var weekData = {}
    var tableBody = week.getElementsByClassName("Table2__tbody")[0];
    var teamNames = tableBody.getElementsByClassName("teamName truncate");
    var weekScores = tableBody.getElementsByClassName("result-column");
    // console.log(teamNames.length);
    // console.log(weekScores.length);
    
    var includeWeek = false;
    for (var j=0; j<teamNames.length; j++) {
      var name = teamNames[j].getAttribute("title");
      var score = weekScores[j].getElementsByClassName("link");
      if (score.length === 0) {
        continue;
      } else {
        score = score[0].innerHTML;
        if (score != 0) {
          includeWeek = true;
        }
      }
      // console.log(name);
      // console.log(score);
      weekData[name] = parseFloat(score);
    }
    console.log(weekData);
    if (includeWeek) {
      scoreData[i] = weekData;
    }
  }
  console.log(scoreData);
  
  console.log("sending message");
  chrome.runtime.sendMessage({
    scores: scoreData,
    action: "getScores"
  });
};


getData();
