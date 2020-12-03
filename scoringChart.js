

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
    chartLabels.push(week)
  }
  
  let filteredScoreData = getFilteredScoreData(scoreData);

  var chartDataSets = []
  for (let team in filteredScoreData.totals) {
    var teamDataSet = {
      label: team,
      borderColor: [Math.floor(Math.random()*16777215).toString(16)],
      borderWidth: 1
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