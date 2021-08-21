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
  colorMap;
  chart;
  // This is used to make sure the chart stays in place even when the 
  // table above it changes height.
  // {
  //   filterOffset: Int
  //   scrollOffset: Int
  // }
  storedScrollInfo
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
    this.colorMap = this.createColorMap();
    this.insertScoringChart();
  }

shouldInvert(r, g, b) {
  let brightness = (299*r + 587*g + 114*b) / 1000;
  // (the hardcoded value is Annie's because it's ugly)
  return (brightness > 230 || brightness == 143.398);
}
 
invertHex(hex) {
  return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

rgbToHexString(r, g, b) {
  let intValue = Math.round(r << 16) + Math.round(g << 8) + Math.round(b);
  let unpadded = intValue.toString(16).toUpperCase();
  let padded = "00000".substring(0, 6 - unpadded.length) + unpadded;
  return "#" + padded;
}

intToColorObject(i) {
  let r = (i & 0x00FF0000) >> 16;
  let g = (i & 0x0000FF00) >> 8;
  let b = (i & 0x000000FF) >> 0;
  
  if (this.shouldInvert(r, g, b)) {
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }
  
  let identifier = this.rgbToHexString(r, g, b);
  let color = d3.lab(identifier);
  return color;
}

doesColorResembleExistingColors(color, existingColors) {
  let result = existingColors.filter((existingColor) => {
    let deltaE = this.deltaE(color, existingColor);
    return deltaE < 40;
  })
  
  return result.length > 0;
}

deltaE(color1, color2) {
  let L = (color1.l - color2.l)**2;
  let A = (color1.a - color2.a)**2;
  let B = (color1.b - color2.b)**2;
  return (L + A + B) ** (1/2);
}

createColorMap() {
  let colorMap = {};
  for (let teamName in this.scoreData.totals) {
    let hashModifier = "";
    let modifiedTeamName = "";
    let acceptableNewColor = false;
    let color;
    
    // Continues this loop until the color is sufficiently different from all others
    while (!acceptableNewColor) {
      // Modifies the team name to get a new color seed
      modifiedTeamName = teamName + hashModifier;
      // Gets a new color based on the modified name
      color = this.intToColorObject(modifiedTeamName.hashCode());
      
      // If this has been going on for too long, just stop
      if (hashModifier.length > 100) {
        acceptableNewColor = true;
      }
      // Otherwise, if the color resembles existing colors, change the hash modifier
      else if (this.doesColorResembleExistingColors(color, Object.values(colorMap))) {
        hashModifier += "a";
      }
      // Otherwise, break out of this loop
      else {
        acceptableNewColor = true;
      }
    }
    
    colorMap[teamName] = color;
  }
  
  return colorMap;
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
  
  this.updateScrollInfo();
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
    let color = d3.rgb(this.colorMap[team]);
    let teamColor = this.rgbToHexString(color.r, color.g, color.b);
    let oppTeamColor = teamColor + "66";    
    
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
        yAxisID: axis,
        borderColor: oppTeamColor,
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

updateScrollInfo() {
  let chartElement = document.querySelector("#chartRoot");
  this.storedScrollInfo = {
    filterOffset: chartElement.offsetTop,
    scrollOffset: window.scrollY
  }
}

didUpdateScoreDataFilter(filterInfo) {
  this.updateScrollInfo();
  this.updateScoringChart(filterInfo);
}

didUpdateWeeklyTableToolbar() {
  this.updateScrollInfo();
}

// After updating the weekly table, this scrolls the screen so that 
// the chart is in the same position as before.
// This has the effect of making the table look like it grows upwards
// rather than downwards, which is visually smoother
didFinishDisplayingWeeklyTable() {
  let chartElement = document.querySelector("#chartRoot");
  let newFilterOffset = chartElement.offsetTop;
  let filterPositionChange = newFilterOffset - this.storedScrollInfo.filterOffset;
  let desiredScrollPosition = this.storedScrollInfo.scrollOffset + filterPositionChange;
  
  window.scrollTo(window.scrollX, desiredScrollPosition);
}
}
