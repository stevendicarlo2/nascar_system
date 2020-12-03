String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function shouldInvert(hash) {
  let r = (hash & 0x00FF0000) >> 16;
  let g = (hash & 0x0000FF00) >> 8;
  let b = (hash & 0x000000FF) >> 0;
  let brightness = (299*r + 587*g + 114*b) / 1000;
  // (the hardcoded value is Annie's because it's ugly)
  return (brightness > 230 || brightness == 143.398);
}

function invertHex(hex) {
  return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

function intToRGB(i){
  let c = (i & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  let rgbString = "00000".substring(0, 6 - c.length) + c;
  if (shouldInvert(i)) {
    return invertHex(rgbString);
  }
  else {
    return rgbString;
  }
}

function insertScoringChart(scoreData, pointsPerWin) {
  console.log("in insertScoringChart");

  $(document).ready(function () {
    let chartRoot = document.getElementById('chartRoot');
    let chartContainer = document.createElement("div");
    chartContainer.style = "position: relative; height:40vh; width:80vw";
    chartContainer.innerHTML += `<canvas id="myChart" width="400" height="400"></canvas>`;
    chartRoot.appendChild(chartContainer);

    let teamFilter = createTeamFilterItem(scoreData);
    if (teamFilter != null) {
      chartRoot.appendChild(teamFilter);
    }
    updateScoringChart(scoreData, pointsPerWin);
  })
}

function updateScoringChart(scoreData, pointsPerWin) {
  var ctx = document.getElementById('myChart').getContext('2d');
  var chartLabels = []
  for (let week in scoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    chartLabels.push((parseInt(week) + 1).toString())
  }
  
  let filteredScoreData = getFilteredScoreData(scoreData);

  var chartDataSets = []
  for (let team in filteredScoreData.totals) {
    let teamColor = "#" + intToRGB(team.hashCode());
    var teamDataSet = {
      label: team,
      borderColor: teamColor,
      borderWidth: 5,
      fill: false,
      lineTension: .1
    }
    var teamData = []
    for (let week in filteredScoreData.weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      let info = filteredScoreData.weekly_breakdown[week][team];
      teamData.push(info.nascar_points)
    }
    teamDataSet.data = teamData
    chartDataSets.push(teamDataSet)
  }
  
  console.log("chartDataSets:", chartDataSets);
  
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: chartDataSets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  })
}

function getFilteredScoreData(scoreData) {
  let copiedScoreData = {
    totals: {},
    weekly_breakdown: {}
  };
  let teamFilter = document.getElementById("teamFilter");
  let teamOptions = teamFilter.querySelectorAll("option");
  
  teamOptions.forEach(function(teamOption) {
    let teamName = teamOption.value;
    if (teamOption.selected == true) {
      copiedScoreData.totals[teamName] = scoreData.totals[teamName];
      for (let week in scoreData.weekly_breakdown) {
        if (copiedScoreData.weekly_breakdown[week] == undefined) {
          copiedScoreData.weekly_breakdown[week] = {};
        }
        copiedScoreData.weekly_breakdown[week][teamName] = scoreData.weekly_breakdown[week][teamName];
      }
    }
  })
  console.log("copiedScoreData: ", copiedScoreData);
  return copiedScoreData;
}

function createTeamFilterItem(scoreData) {
  if (document.getElementById("teamFilter")) {
    return null;
  }
  let selectorRoot = document.createElement("select");
  selectorRoot.id = "teamFilter";
  selectorRoot.setAttribute("multiple", "");
  
  for (let team in scoreData.totals) {
    let teamOption = document.createElement("option");
    teamOption.innerHTML = team;
    teamOption.setAttribute("value", team);
    teamOption.onclick = function() {
      teamOption.setAttribute("selected", true);
      updateScoringChart(scoreData);
    };

    selectorRoot.appendChild(teamOption);
  }
  
  return selectorRoot
}