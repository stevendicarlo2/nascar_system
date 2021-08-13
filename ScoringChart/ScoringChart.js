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
  root;
  scoreData;
  pointsPerWin;
  chart;
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
    this.insertScoringChart();
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
  let chartRoot = document.createElement("div");
  chartRoot.id = "chartRoot";
  this.root.appendChild(chartRoot);

  let chartContainer = document.createElement("div");
  chartContainer.style = "position: relative; height:40vh; width:100%";
  chartContainer.innerHTML += `<canvas id="myChart"></canvas>`;
  chartRoot.appendChild(chartContainer);

  var ctx = this.root.querySelector("#myChart").getContext('2d');
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
        yAxes: [
          {
            id: "nascarAxis",
            scaleLabel: {
              display: true,
              labelString: "NP/ANP"
            }
          },
          {
            id: "rawPointAxis",
            display: "auto",
            position: "right",
            gridLines: {
              display: false
            },
            scaleLabel: {
              display: true,
              labelString: "POINTS"
            }
          }
        ]
      }
    }
  })
}

updateScoringChart(filterInfo) {
  let filteredScoreData = this.getFilteredScoreData(filterInfo);

  var chartLabels = []
  for (let week in filteredScoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    chartLabels.push((parseInt(week) + 1).toString())
  }
  
  var chartDataSets = []
  for (let team in filteredScoreData.totals) {
    let teamColor = "#" + this.intToRGB(team.hashCode());
    
    filterInfo.scoreTypeFilterInfo.selectedPointTypes.forEach((selectedPointType, pointTypeIndex) => {
      let labelAnnotation, axis;
      if (selectedPointType === PointsTypeEnum.np) {
        labelAnnotation = "NP";
        axis = "nascarAxis";
      }
      else if (selectedPointType === PointsTypeEnum.anp) {
        labelAnnotation = "ANP";
        axis = "nascarAxis";
      }
      else if (selectedPointType === PointsTypeEnum.points) {
        labelAnnotation = "POINTS";
        axis = "rawPointAxis";
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
        yAxisID: axis,
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
        if (selectedPointType === PointsTypeEnum.np) {
          teamData.push(info.nascar_points)
          opponentData.push(info.oppNP)
        }
        else if (selectedPointType === PointsTypeEnum.anp) {
          teamData.push(info.nascar_points + info.wins*this.pointsPerWin)
          opponentData.push(info.oppNP + (1-info.wins)*this.pointsPerWin)
        }
        else if (selectedPointType === PointsTypeEnum.points) {
          teamData.push(info.score)
          opponentData.push(info.oppScore)
        }
      }
      dataSet.data = teamData
      opponentDataSet.data = opponentData
      
      if (filterInfo.scoreTypeFilterInfo.includeTeamScore) {
        chartDataSets.push(dataSet)
      }
      if (filterInfo.scoreTypeFilterInfo.includeOpponentScore) {
        chartDataSets.push(opponentDataSet)
      }
    })
  }
  
  console.log("chartDataSets:", chartDataSets);
  
  this.chart.data.labels = chartLabels;
  this.chart.data.datasets = chartDataSets;
  this.chart.update(0);
}

getFilteredScoreData(filterInfo) {
  let copiedScoreData = {
    totals: {},
    weekly_breakdown: {}
  };
  
  let teamOptions = filterInfo.teamFilterInfo;
  let weekMin = filterInfo.weekFilterInfo.weekMin;
  let weekMax = filterInfo.weekFilterInfo.weekMax;
  
  teamOptions.forEach((teamName) => {
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
  })
  console.log("copiedScoreData: ", copiedScoreData);
  return copiedScoreData;
}

didUpdateScoreDataFilter(filterInfo) {
  this.updateScoringChart(filterInfo);
}
}
