
if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

class WeeklyBreakdownTable {
  shadowRoot;
  scoreData;
  pointsPerWin;
  filterInfo;
  weeklyToolbarInfo;
  tableElement;
  
  constructor(shadowRoot, scoreData, pointsPerWin) {
    this.shadowRoot = shadowRoot;
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
    this.convertScoreDataToTableStructure();
  }

async didUpdateScoreDataFilter(filterInfo) {
  let table = $('#weekly_breakdown_table').DataTable();

  this.filterInfo = filterInfo;
  let weekMin = this.filterInfo.weekFilterInfo.weekMin;
  let weekMax = this.filterInfo.weekFilterInfo.weekMax;
  let weekRange = [...Array(weekMax-weekMin+1).keys()];
  // The range has to be adjusted by 7 columns of total/summary columns,
  // minus 1 because weekMin starts at 1 not 0
  let adjustedWeekRange = weekRange.map(x => x + weekMin + 6);
  
  let summaryColumns = [0];
  if (filterInfo.scoreTypeFilterInfo.selectedPointTypes.includes(PointsTypeEnum.np)) {
    if (filterInfo.scoreTypeFilterInfo.includeTeamScore) {
      summaryColumns.push(1);
    }
    if (filterInfo.scoreTypeFilterInfo.includeOpponentScore) {
      summaryColumns.push(4);
    }
  }
  if (filterInfo.scoreTypeFilterInfo.selectedPointTypes.includes(PointsTypeEnum.anp)) {
    if (filterInfo.scoreTypeFilterInfo.includeTeamScore) {
      summaryColumns.push(2);
    }
    if (filterInfo.scoreTypeFilterInfo.includeOpponentScore) {
      summaryColumns.push(5);
    }
  }
  if (filterInfo.scoreTypeFilterInfo.selectedPointTypes.includes(PointsTypeEnum.points)) {
    if (filterInfo.scoreTypeFilterInfo.includeTeamScore) {
      summaryColumns.push(3);
    }
    if (filterInfo.scoreTypeFilterInfo.includeOpponentScore) {
      summaryColumns.push(6);
    }
  }
  
  // This is a hack to allow the ScoringChart to update faster.
  // These `visible` calls take a long time, and this sleep allows the ScoringChart
  // to update on its thread without this slowing it down. 
  // The sleep doesn't make this any slower than it already is though.
  await window.sleep(0);
  
  table.columns().visible(false);
  table.columns(summaryColumns).visible(true);
  table.columns(adjustedWeekRange).visible(true);
  table.fixedColumns().relayout();
}

createWeeklyBreakdownTable(useNascarPoints = true) {
  console.log("abcabc createWeeklyBreakdownTable");
    
  let container = document.createElement("div");
  container.id = "myDataTable";
  this.shadowRoot.appendChild(container);

  let table = document.createElement("table");
  table.classList.add("table", "table-bordered", "table-sm");
  table.id = "weekly_breakdown_table";
  container.appendChild(table);

  let tableData = this.convertScoreDataToTableStructure();
  let columns = this.createColumnDefinitionsForTable();
  let dataTable;
  if ($.fn.dataTable.isDataTable('#weekly_breakdown_table')) {
    dataTable = $('#weekly_breakdown_table').DataTable();
  } else {
    dataTable = $('#weekly_breakdown_table').DataTable({
      searching: false,
      paging: false,
      data: tableData,
      columns: columns,
      order: [2, "desc"],
      scrollX: true,
      fixedColumns: {
        leftColumns: 7
      }
    });
  }
  this.highlightTable();
  // This makes sure the frozen columns at the left get the highlighted colors
  dataTable.fixedColumns().relayout();
}

updateWeeklyToolbarInfo(weeklyToolbarInfo) {
  this.weeklyToolbarInfo = weeklyToolbarInfo;
}

createColumnDefinitionsForTable() {
  let columns = [
    { data: "name", title: "Team" },
    { 
      data: "Total NP", 
      title: "Total NP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.np, false)
      }
    },
    { 
      data: "Total ANP", 
      title: "Total ANP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.anp, false)
      }
    },
    { 
      data: "Total Score", 
      title: "Total Score", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.points, false)
      }
    },
    { 
      data: "Opp NP", 
      title: "Opp NP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.np, true)
      }
    },
    { 
      data: "Opp ANP", 
      title: "Opp ANP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.anp, true)
      }
    },
    { 
      data: "Opp Score", 
      title: "Opp Score", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, PointsTypeEnum.points, true)
      }
    },
  ]
  
  let filteredScoreData = this.getFilteredScoreData();

  for (let week in filteredScoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    let weekColumnObject = {
      data: "Week " + (parseInt(week) + 1),
      title: "Week " + (parseInt(week) + 1),
      render: (data, type, row, meta) => {
        return this.renderMethodWeekField(row, week, type)
      }
    }
    columns.push(weekColumnObject);
  }

  return columns;
}

renderMethodTotalField(teamData, scoreType, useOpponentScore) {
  let total = 0;
  for (let week in teamData.weeklyInfo) {
    let weekData = teamData.weeklyInfo[week];
    if (scoreType === PointsTypeEnum.np) {
      if (useOpponentScore) {
        total += weekData.oppNP;
      }
      else {
        total += weekData.nascar_points;
      }
    }
    else if (scoreType === PointsTypeEnum.anp) {
      if (useOpponentScore) {
        total += weekData.oppNP + (1-weekData.wins) * this.pointsPerWin;
      }
      else {
        total += weekData.nascar_points + weekData.wins * this.pointsPerWin;
      }
    }
    else if (scoreType === PointsTypeEnum.points) {
      if (useOpponentScore) {
        total += weekData.oppScore;
      }
      else {
        total += weekData.score;
      }
    }
  }
  return total;
}

renderMethodWeekField(teamData, week, type) {
  let weekInfo = teamData.weeklyInfo[week];
  return weekInfo.nascar_points + weekInfo.wins * this.pointsPerWin;
}

// {
//   name: String
//   weeklyInfo: [
//     {
//       nascar_points: Int
//       oppNP: Int
//       oppName: String
//       oppScore: Float
//       score: Float
//       wins: Float
//     },
//   ]
// }
convertScoreDataToTableStructure() {
  let allDataRows = [];
  let filteredScoreData = this.getFilteredScoreData();
  let weekly_breakdown = filteredScoreData.weekly_breakdown;
  for (let team in filteredScoreData.totals) {
    let teamEntry = {};
    teamEntry.name = team;
    let weeklyInfo = [];
    for (let week in weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      let weekData = weekly_breakdown[week][team];
      weeklyInfo.push(weekData);
    }
    teamEntry.weeklyInfo = weeklyInfo;
    allDataRows.push(teamEntry);
  }
  return allDataRows
}

getMinMaxes() {
  let maxScore=0, maxTotalScore=0, maxNP=0, maxTotalNP=0, maxANP=0, maxTotalANP=0;
  let minScore, minTotalScore, minNP, minTotalNP, minANP, minTotalANP;

  let data = $('#weekly_breakdown_table').DataTable().data().each((teamInfo) => {
    let weeklyInfo = teamInfo.weeklyInfo;
    let teamTotalNP=0, teamTotalANP=0, teamTotalScore=0;

    for (let week in weeklyInfo) {
      let score = weeklyInfo[week].score;
      let nascarPoints = weeklyInfo[week].nascar_points;
      let adjNascarPoints = nascarPoints + this.pointsPerWin * weeklyInfo[week].wins;
      if (minScore === undefined || minNP === undefined || minTotalNP === undefined) {
        minScore = score;
        minNP = nascarPoints;
        minANP = adjNascarPoints
      }
      
      minScore = (score < minScore) ? score : minScore;
      minNP = (nascarPoints < minNP) ? nascarPoints : minNP;
      minANP = (adjNascarPoints < minANP) ? adjNascarPoints : minANP;
      maxScore = (score > maxScore) ? score : maxScore;
      maxNP = (nascarPoints > maxNP) ? nascarPoints : maxNP;
      maxANP = (adjNascarPoints > maxANP) ? adjNascarPoints : maxANP;
      
      teamTotalNP += nascarPoints;
      teamTotalANP += adjNascarPoints;
      teamTotalScore += score;
    }
    
    if (minTotalNP === undefined || minTotalANP === undefined || minTotalScore === undefined) {
      minTotalNP = teamTotalNP;
      minTotalANP = teamTotalANP;
      minTotalScore = teamTotalScore;
    }
    else {
      minTotalNP = (teamTotalNP < minTotalNP) ? teamTotalNP : minTotalNP;
      minTotalANP = (teamTotalANP < minTotalANP) ? teamTotalANP : minTotalANP;
      minTotalScore = (teamTotalScore < minTotalScore) ? teamTotalScore : minTotalScore;
      maxTotalNP = (teamTotalNP > maxTotalNP) ? teamTotalNP : maxTotalNP;
      maxTotalANP = (teamTotalANP > maxTotalANP) ? teamTotalANP : maxTotalANP;
      maxTotalScore = (teamTotalScore > maxTotalScore) ? teamTotalScore : maxTotalScore;
    }
  });
    
  return {
    minScore: minScore,
    minNP: minNP,
    minANP: minANP,
    minTotalScore: minTotalScore,
    minTotalNP: minTotalNP,
    minTotalANP: minTotalANP,
    maxScore: maxScore,
    maxNP: maxNP,
    maxANP: maxANP,
    maxTotalScore: maxTotalScore,
    maxTotalNP: maxTotalNP,
    maxTotalANP: maxTotalANP
  }
}

highlightTable() {
  let minMaxes = this.getMinMaxes();

  let badColor = "#fe7575";
  let mediumColor = "#ffff88";
  let goodColor = "#64a764";
  let colorScaleANP = d3.scaleLinear()
  .domain([minMaxes.minANP, (minMaxes.minANP+minMaxes.maxANP)/2, minMaxes.maxANP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleScore = d3.scaleLinear()
  .domain([minMaxes.minScore, (minMaxes.minScore+minMaxes.maxScore)/2, minMaxes.maxScore])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleTotalScore = d3.scaleLinear()
  .domain([minMaxes.minTotalScore, (minMaxes.minTotalScore+minMaxes.maxTotalScore)/2, minMaxes.maxTotalScore])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleTotalNP = d3.scaleLinear()
  .domain([minMaxes.minTotalNP, (minMaxes.minTotalNP+minMaxes.maxTotalNP)/2, minMaxes.maxTotalNP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleTotalANP = d3.scaleLinear()
  .domain([minMaxes.minTotalANP, (minMaxes.minTotalANP+minMaxes.maxTotalANP)/2, minMaxes.maxTotalANP])
  .range([badColor, mediumColor, goodColor]);

  let table = $('#weekly_breakdown_table').DataTable();
  table.cells().every( (row, column) => {
    if (column == 0) {
      return;
    }
    
    let cell = table.cell(row, column);
    let node = cell.node();
    let value = parseFloat(node.textContent);
    let color;
    if (column == 1) {
      color = colorScaleTotalNP(value);
    }
    else if (column == 2) {
      color = colorScaleTotalANP(value);
    }
    else if (column == 3) {
      color = colorScaleTotalScore(value);
    }
    else if (column == 4) {
      color = colorScaleTotalNP(value);
    }
    else if (column == 5) {
      color = colorScaleTotalANP(value);
    }
    else if (column == 6) {
      color = colorScaleTotalScore(value);
    }
    else {
      color = colorScaleANP(value);
    }
    
    node.style = "background-color:" + color;
  });
}

getFilteredScoreData() {
  return this.scoreData;
  
  if (this.filterInfo === undefined) {
    return this.scoreData;
  }
  
  let copiedScoreData = {
    totals: {},
    weekly_breakdown: {}
  };
  
  let teamOptions = this.filterInfo.teamFilterInfo;
  let weekMin = this.filterInfo.weekFilterInfo.weekMin;
  let weekMax = this.filterInfo.weekFilterInfo.weekMax;
  
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
}
