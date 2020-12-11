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
      var oppName = teamNames[oppIndex].getAttribute("title")
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
      
      // console.log("week: " ,i);
      // 
      // if (i == 12) {
      //   if (name == "2-0  vs Brady") {
      //     score = 109.0;
      //     wins = 1;
      //   }
      //   else if (name == "Aaron Rodgers' Mustache") {
      //     score = 101.9;
      //     wins = 1;
      //   }
      //   else if (name == "Alvin and the Chipmunks") {
      //     score = 101.6;
      //     wins = 1;
      //   }
      //   else if (name == "Captain Bench") {
      //     score = 106.6;
      //     wins = 1;
      //   }
      //   else if (name == "Coach Bronco's Wild Ride") {
      //     score = 87.8;
      //     wins = 0;
      //   }
      //   else if (name == "Dalvin and Hobbes") {
      //     score = 93.6;
      //     wins = 1;
      //   }
      //   else if (name == "Harper Hempel Hemp") {
      //     score = 93.9;
      //     wins = 0;
      //   }
      //   else if (name == "Jones Town") {
      //     score = 127.3;
      //     wins = 1;
      //   }
      //   else if (name == "Kenyan Drake and Josh") {
      //     score = 130.4;
      //     wins = 0;
      //   }
      //   else if (name == "Take Mahomes Country Road") {
      //     score = 82.6;
      //     wins = 0;
      //   }
      //   else if (name == "The Real Slim Brady") {
      //     score = 135.0;
      //     wins = 1;
      //   }
      //   else if (name == "Where my Younghoes at") {
      //     score = 98.2;
      //     wins = 0;
      //   }
      //   else if (name == "the Adams family") {
      //     score = 93.1;
      //     wins = 0;
      //   }
      //   else if (name == "~ Liz,Lamar,noLex") {
      //     score = 67.3;
      //     wins = 0;
      //   }
      //   else {
      //     console.log("THIS IS AN ISSUE: ", name);
      //   }
      // }
      
      // console.log(name);
      // console.log(score);
      weekData[name] = {"score": score, "wins": wins, "oppScore": oppScore, "oppName": oppName};
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
