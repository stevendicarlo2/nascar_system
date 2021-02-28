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

class ScoringChart {
  scoreData;
  pointsPerWin;
  chart;
  
  constructor(scoreData, pointsPerWin) {
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
  }

shouldInvert(hash) {
  let r = (hash & 0x00FF0000) >> 16;
  let g = (hash & 0x0000FF00) >> 8;
  let b = (hash & 0x000000FF) >> 0;
  let brightness = (299*r + 587*g + 114*b) / 1000;
  // (the hardcoded value is Annie's because it's ugly)
  return (brightness > 230 || brightness == 143.398);
}
 
invertHex(hex) {
  return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

intToRGB(i) {
  let c = (i & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  let rgbString = "00000".substring(0, 6 - c.length) + c;
  if (this.shouldInvert(i)) {
    return this.invertHex(rgbString);
  }
  else {
    return rgbString;
  }
}

insertScoringChart() {
  console.log("in insertScoringChart");
  $(document).ready(() => {
    let shadowRoot = document.querySelector(".shadowRoot");
    let existingChartRoot = shadowRoot.querySelector("#chartRoot");
    
    if (existingChartRoot != undefined) {
      console.log("skipping insertScoringChart");
      return
    }

    let chartRoot = document.createElement("div");
    chartRoot.id = "chartRoot";
    shadowRoot.appendChild(chartRoot);
  
    let chartContainer = document.createElement("div");
    chartContainer.style = "position: relative; height:40vh; width:80vw";
    chartContainer.innerHTML += `<canvas id="myChart" width="400" height="400"></canvas>`;
    chartRoot.appendChild(chartContainer);

    var ctx = document.getElementById('myChart').getContext('2d');
    this.chart = new Chart(ctx, {
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
    
    let teamFilter = this.createTeamFilterItem();
    if (teamFilter != null) {
      chartRoot.appendChild(teamFilter);
    }
    
    let customizationToolbar = this.createCustomizationToolbar();
    if (customizationToolbar != null) {
      chartRoot.appendChild(customizationToolbar);
    }
    
    let weekRange = this.createWeekRange();
    if (weekRange != null) {
      chartRoot.appendChild(weekRange);
      // The jquery modification in this method has to be done after appending the child into the DOM,
      // it doesn't work when doing it before adding it to the DOM.
      this.customizeWeekRange();
    }

    this.updateScoringChart();
  })
}

updateScoringChart() {
  let filteredScoreData = this.getFilteredScoreData();

  var chartLabels = []
  for (let week in filteredScoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    chartLabels.push((parseInt(week) + 1).toString())
  }
  
  let selectedPointTypeButtons = document.querySelector("#scoreTypeSelector").querySelectorAll("button.active");
  let teamScoreButtons = document.querySelector("#opponentScoreSelector").querySelectorAll("button.active");
  let includeTeamScore = false;
  let includeOpponentScore = false;
  
  teamScoreButtons.forEach((button) => {
    let buttonValue = button.getAttribute("value");
    if (buttonValue == "teamScore") {
      includeTeamScore = true;
    }
    else if (buttonValue == "oppScore") {
      includeOpponentScore = true;
    }
  })
  
  var chartDataSets = []
  for (let team in filteredScoreData.totals) {
    let teamColor = "#" + this.intToRGB(team.hashCode());
    
    selectedPointTypeButtons.forEach((selectedPointTypeButton, pointTypeIndex) => {
      let labelAnnotation;
      if (selectedPointTypeButton.value == "np") {
        labelAnnotation = "NP";
      }
      else if (selectedPointTypeButton.value == "anp") {
        labelAnnotation = "ANP";
      }
      else if (selectedPointTypeButton.value == "points") {
        labelAnnotation = "POINTS";
      }
      
      let borderDash;
      if (pointTypeIndex == 0) {
        borderDash = [];
      }
      else if (pointTypeIndex == 1) {
        borderDash = [15, 15];
      }
      else if (pointTypeIndex == 2) {
        borderDash = [5, 5];
      }
      var dataSet = {
        label: team + " " + labelAnnotation,
        borderColor: teamColor,
        borderWidth: 5,
        borderDash: borderDash,
        fill: false,
        lineTension: .1
      }
      var opponentDataSet = {
        label: team + " OPP " + labelAnnotation,
        borderColor: teamColor + "66",
        borderWidth: 5,
        borderDash: borderDash,
        fill: false,
        lineTension: .1
      }
      var teamData = []
      var opponentData = []

      for (let week in filteredScoreData.weekly_breakdown) {
        if (week === "storedTime") {
          continue;
        }
        let info = filteredScoreData.weekly_breakdown[week][team];
        if (selectedPointTypeButton.value == "np") {
          teamData.push(info.nascar_points)
          opponentData.push(info.oppNP)
        }
        else if (selectedPointTypeButton.value == "anp") {
          teamData.push(info.nascar_points + info.wins*this.pointsPerWin)
          opponentData.push(info.oppNP + (1-info.wins)*this.pointsPerWin)
        }
        else if (selectedPointTypeButton.value == "points") {
          teamData.push(info.score)
          opponentData.push(info.oppScore)
        }
      }
      dataSet.data = teamData
      opponentDataSet.data = opponentData
      
      if (includeTeamScore) {
        chartDataSets.push(dataSet)
      }
      if (includeOpponentScore) {
        chartDataSets.push(opponentDataSet)
      }
    })
  }
  
  console.log("chartDataSets:", chartDataSets);
  
  this.chart.data.labels = chartLabels;
  this.chart.data.datasets = chartDataSets;
  this.chart.update(0);
}

getFilteredScoreData() {
  let copiedScoreData = {
    totals: {},
    weekly_breakdown: {}
  };
  let teamFilter = document.getElementById("teamFilter");
  let teamOptions = teamFilter.querySelectorAll("li");
  let weekMin = $( "#weekRangeRoot .weekRange" ).slider( "values", 0 );
  let weekMax = $( "#weekRangeRoot .weekRange" ).slider( "values", 1 );
  
  teamOptions.forEach((teamOption) => {
    let teamName = teamOption.getAttribute("value");
    if (teamOption.classList.contains("active")) {
      copiedScoreData.totals[teamName] = this.scoreData.totals[teamName];
      for (let week in this.scoreData.weekly_breakdown) {
        let weekValue = parseInt(week) + 1;
        if (weekValue < weekMin || weekValue > weekMax) {
          continue;
        }
        if (copiedScoreData.weekly_breakdown[week] == undefined) {
          copiedScoreData.weekly_breakdown[week] = {};
        }
        copiedScoreData.weekly_breakdown[week][teamName] = this.scoreData.weekly_breakdown[week][teamName];
      }
    }
  })
  console.log("copiedScoreData: ", copiedScoreData);
  return copiedScoreData;
}

createTeamFilterItem() {
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
  let teamCount = Object.keys(this.scoreData.totals).length;
  let maxHeight = Math.ceil(teamCount/3);
  for (let team in this.scoreData.totals) {
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
    teamOption.onclick = () => {
      if (teamOption.classList.contains("active")) {
        teamOption.classList.remove("active");
      }
      else {
        teamOption.classList.add("active");
      }
      this.updateScoringChart();
    };

    heightCounter += 1;
    listRoot.appendChild(teamOption);
  }
  
  return selectorRoot
}

createCustomizationToolbar() {
  if (document.getElementById("toolbarRoot")) {
    return null;
  }

  let toolbarRoot = document.createElement("div");
  toolbarRoot.id = "toolbarRoot";
  toolbarRoot.classList.add("btn-toolbar");
  toolbarRoot.setAttribute("role", "toolbar");
  
  let scoreTypeSelector = this.createScoreTypeSelector();
  toolbarRoot.appendChild(scoreTypeSelector);
  
  let opponentScoreSelector = this.createOpponentScoreSelector();
  toolbarRoot.appendChild(opponentScoreSelector);

  return toolbarRoot;
}

createScoreTypeSelector() {
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
  
  scoreButtons.forEach((scoreButton) => {
    scoreButton.classList.add("btn", "btn-secondary");
    scoreButton.setAttribute("type", "button");
    scoreButton.setAttribute("data-toggle", "button");
    scoreButton.onclick = () => {
      if (scoreButton.classList.contains("active")) {
        scoreButton.classList.remove("active");
      }
      else {
        scoreButton.classList.add("active");
      }
      
      this.updateScoringChart();
    };
    scoreTypeButtonGroup.appendChild(scoreButton);
  })

  return scoreTypeRoot;
}

createOpponentScoreSelector() {
  let opponentScoreSelector = document.createElement("div");
  opponentScoreSelector.id = "opponentScoreSelector";

  let opponentScoreButtonGroup = document.createElement("div");
  opponentScoreButtonGroup.classList.add("btn-group");
  opponentScoreButtonGroup.setAttribute("role", "group");
  opponentScoreSelector.appendChild(opponentScoreButtonGroup);
  
  let buttons = [];

  let teamScoreButton = document.createElement("button");
  teamScoreButton.innerHTML = "Show selected team's data";
  teamScoreButton.classList.add("active");
  teamScoreButton.setAttribute("value", "teamScore");
  buttons.push(teamScoreButton);

  let opponentScoreButton = document.createElement("button");
  opponentScoreButton.innerHTML = "Show opponent data";
  opponentScoreButton.setAttribute("value", "oppScore");
  buttons.push(opponentScoreButton);
  
  buttons.forEach((button) => {
    button.classList.add("btn", "btn-secondary");
    button.setAttribute("type", "button");
    button.setAttribute("data-toggle", "button");
    button.onclick = () => {
      if (button.classList.contains("active")) {
        button.classList.remove("active");
      }
      else {
        button.classList.add("active");
      }
      
      this.updateScoringChart();
    };
    opponentScoreButtonGroup.appendChild(button);
  })

  return opponentScoreSelector;
}

createWeekRange() {
  if (document.getElementById("weekRangeRoot")) {
    return null;
  }

  let weekRangeRoot = document.createElement("div");
  weekRangeRoot.id = "weekRangeRoot";
  
  let weekRange = document.createElement("div");
  weekRange.classList.add("weekRange");
  weekRangeRoot.appendChild(weekRange);
  
  return weekRangeRoot;
}

customizeWeekRange() {
  // Subtract one here because one of the keys is for the last stored time
  let numberOfWeeks = Object.keys(this.scoreData.weekly_breakdown).length - 1;

  $( "#weekRangeRoot .weekRange" ).slider({
    change: (event, ui) => { 
      this.updateScoringChart();
    },
    min: 1,
    max: numberOfWeeks,
    range: true,
    values: [1, numberOfWeeks]
  });
  
  let weekRangeRoot = document.getElementById("weekRangeRoot");
  let weekRangeLabelContainer = document.createElement("div");
  weekRangeLabelContainer.classList.add("weekRangeLabelContainer");
  for (let i = 1; i <= numberOfWeeks; i++) {
    let weekRangeLabel = document.createElement("div");
    weekRangeLabel.classList.add("weekRangeLabel");
    weekRangeLabel.innerHTML = i;
    weekRangeLabelContainer.appendChild(weekRangeLabel);
  }
  weekRangeRoot.appendChild(weekRangeLabelContainer);
}
}
