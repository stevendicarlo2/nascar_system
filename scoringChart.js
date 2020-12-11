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

    var ctx = document.getElementById('myChart').getContext('2d');
    let chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              // beginAtZero: true,
              // max: 14
            }
          }]
        }
      }
    })
    
    let teamFilter = createTeamFilterItem(chart, scoreData, pointsPerWin);
    if (teamFilter != null) {
      chartRoot.appendChild(teamFilter);
    }
    
    let scoreTypeSelector = createScoreTypeSelector(chart, scoreData, pointsPerWin);
    if (scoreTypeSelector != null) {
      chartRoot.appendChild(scoreTypeSelector);
    }

    updateScoringChart(chart, scoreData, pointsPerWin);
  })
}

function updateScoringChart(chart, scoreData, pointsPerWin) {
  var chartLabels = []
  for (let week in scoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    chartLabels.push((parseInt(week) + 1).toString())
  }
  
  let filteredScoreData = getFilteredScoreData(scoreData);
  let selectedPointTypeButton = document.querySelector("#scoreTypeSelector").querySelector("button.active");

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
      if (selectedPointTypeButton.value == "np") {
        teamData.push(info.nascar_points)
      }
      else if (selectedPointTypeButton.value == "anp") {
        teamData.push(info.nascar_points + info.wins*pointsPerWin)
      }
      else if (selectedPointTypeButton.value == "points") {
        teamData.push(info.score)
      }
    }
    teamDataSet.data = teamData
    chartDataSets.push(teamDataSet)
  }
  
  console.log("chartDataSets:", chartDataSets);
  
  chart.data.labels = chartLabels;
  chart.data.datasets = chartDataSets;
  chart.update(0);
}

function getFilteredScoreData(scoreData) {
  let copiedScoreData = {
    totals: {},
    weekly_breakdown: {}
  };
  let teamFilter = document.getElementById("teamFilter");
  let teamOptions = teamFilter.querySelectorAll("li");
  
  teamOptions.forEach(function(teamOption) {
    let teamName = teamOption.getAttribute("value");
    if (teamOption.classList.contains("active")) {
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

function createTeamFilterItem(chart, scoreData, pointsPerWin) {
  if (document.getElementById("teamFilter")) {
    return null;
  }
  let selectorRoot = document.createElement("div");
  selectorRoot.id = "teamFilter";
  
  var listRoot = document.createElement("ul");
  selectorRoot.appendChild(listRoot);
  listRoot.classList.add("list-group", "team-filter-group");
  
  // There are 3 roughly equally-sized columns of teams in the selector
  var heightCounter = 0;
  let teamCount = Object.keys(scoreData.totals).length;
  let maxHeight = Math.ceil(teamCount/3);
  for (let team in scoreData.totals) {
    if (heightCounter >= maxHeight) {
      listRoot = document.createElement("ul");
      selectorRoot.appendChild(listRoot);
      listRoot.classList.add("list-group", "team-filter-group");
      heightCounter = 0;
    }
    
    let teamOption = document.createElement("li");
    teamOption.classList.add("list-group-item");
    teamOption.innerHTML = team;
    teamOption.setAttribute("value", team);
    teamOption.onclick = function() {
      if (teamOption.classList.contains("active")) {
        teamOption.classList.remove("active");
      }
      else {
        teamOption.classList.add("active");
      }
      updateScoringChart(chart, scoreData, pointsPerWin);
    };

    heightCounter += 1;
    listRoot.appendChild(teamOption);
  }
  
  return selectorRoot
}

function createScoreTypeSelector(chart, scoreData, pointsPerWin) {
  if (document.getElementById("scoreTypeSelector")) {
    return null;
  }
  let scoreTypeRoot = document.createElement("div");
  scoreTypeRoot.id = "scoreTypeSelector";

  let scoreTypeButtonGroup = document.createElement("div");
  scoreTypeButtonGroup.classList.add("btn-group");
  scoreTypeButtonGroup.setAttribute("role", "group");
  scoreTypeRoot.appendChild(scoreTypeButtonGroup);
  
  var scoreButtons = [];

  let npScoreButton = document.createElement("button");
  npScoreButton.innerHTML = "NP";
  npScoreButton.setAttribute("value", "np")
  npScoreButton.classList.add("active");
  scoreButtons.push(npScoreButton);
  
  let anpScoreButton = document.createElement("button");
  anpScoreButton.innerHTML = "ANP";
  anpScoreButton.setAttribute("value", "anp")
  scoreButtons.push(anpScoreButton);
  
  let rawPointsScoreButton = document.createElement("button");
  rawPointsScoreButton.innerHTML = "Raw Points";
  rawPointsScoreButton.setAttribute("value", "points")
  scoreButtons.push(rawPointsScoreButton);
  
  scoreButtons.forEach(function(scoreButton) {
    scoreButton.classList.add("btn", "btn-secondary");
    scoreButton.setAttribute("type", "button");
    scoreButton.setAttribute("data-toggle", "button");
    scoreButton.onclick = function() {
      scoreButtons.forEach(function(newlyInactiveButton) {
        newlyInactiveButton.classList.remove("active");
      })
      
      scoreButton.classList.add("active");
      updateScoringChart(chart, scoreData, pointsPerWin);
    };
    scoreTypeButtonGroup.appendChild(scoreButton);
  })

  return scoreTypeRoot;
}