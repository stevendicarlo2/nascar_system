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
  shadowRoot;
  scoreData;
  pointsPerWin;
  chart;
  
  constructor(shadowRoot, scoreData, pointsPerWin) {
    this.shadowRoot = shadowRoot;
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
    let existingChartRoot = this.shadowRoot.querySelector("#chartRoot");
    
    if (existingChartRoot != undefined) {
      console.log("skipping insertScoringChart");
      return
    }

    let chartRoot = document.createElement("div");
    chartRoot.id = "chartRoot";
    this.shadowRoot.appendChild(chartRoot);
  
    let chartContainer = document.createElement("div");
    chartContainer.style = "position: relative; height:40vh; width:80vw";
    chartContainer.innerHTML += `<canvas id="myChart" width="400" height="400"></canvas>`;
    chartRoot.appendChild(chartContainer);

    var ctx = this.shadowRoot.querySelector("#myChart").getContext('2d');
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
  
  let selectedPointTypeButtons = this.shadowRoot.querySelector("#scoreTypeSelector").querySelectorAll("button.active");
  let teamScoreButtons = this.shadowRoot.querySelector("#opponentScoreSelector").querySelectorAll("button.active");
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
  let teamFilter = this.shadowRoot.querySelector("#teamFilter");
  let teamOptions = this.shadowRoot.querySelectorAll("li");
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

didUpdateScoreDataFilter() {
  this.updateScoringChart();
}
}
