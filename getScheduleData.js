console.log("starting getScheduleData");
if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

async function getData() {
  console.log("from the schedule page");
  var weeks = document.getElementsByClassName("matchup--table");
  if (weeks.length === 0) {
    console.log("weeks was empty");
    await window.sleep(500);
    weeks = document.getElementsByClassName("matchup--table");
  }
  console.log("got weeks, length" + weeks.length);
  var scoreData = {}
  for (var i=0; i<weeks.length; i++) {
    var week = weeks[i];
    var weekName = week.getElementsByClassName("table-caption dib")[0].innerHTML;
    console.log("weekName:" + weekName);
    if (weekName.includes("Playoff")) {
      continue;
    }
    // console.log(week);
    var weekData = {}
    var tableBody = week.getElementsByClassName("Table__TBODY")[0];
    var teamNames = tableBody.getElementsByClassName("teamName truncate");
    var weekScores = tableBody.getElementsByClassName("result-column");
    // console.log(teamNames.length);
    // console.log(weekScores.length);
    
    var includeWeek = false;
    console.log("teamNames length" + teamNames.length);

    for (var j=0; j<teamNames.length; j++) {
      var name = teamNames[j].getAttribute("title");
      var scoreEntry = weekScores[j].querySelector(".link");

      if (!scoreEntry) {
        continue;
      }
      var score = parseFloat(scoreEntry.innerHTML);
      if (score !== 0) {
        includeWeek = true;
      }

      var wins;
      var oppIndex = (j%2 === 0) ? j+1 : j-1;
      
      var oppScoreEntry = weekScores[oppIndex].querySelector(".link");
      var oppScore = parseFloat(oppScoreEntry.innerHTML);

      console.log("weekScores:");
      console.log(weekScores);
      console.log("score" + score);
      console.log("opp score" + oppScore);

      // if (weekScores[j].classList.contains("winnerTeam")) { wins = 1; }
      // else if (weekScores[oppIndex].classList.contains("winnerTeam")) { wins = 0; }
      // else { wins = .5; }    
      
      if (score > oppScore) { wins = 1; }
      else if (score < oppScore) { wins = 0; }
      else { wins = .5; }    
      
      // console.log(name);
      // console.log(score);
      weekData[name] = {"score": score, "wins": wins};
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
    action: "processScores",
    year: seasonId
  });
};


getData();
