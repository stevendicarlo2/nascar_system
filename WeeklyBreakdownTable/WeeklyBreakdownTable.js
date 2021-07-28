
if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

class WeeklyBreakdownTable {
  shadowRoot;
  scoreData;
  pointsPerWin;
  filterInfo;
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
  // The range has to be adjusted by 3 columns of team/NP/ANP,
  // minus 1 because weekMin starts at 1 not 0
  let adjustedRange = weekRange.map(x => x + weekMin + 2);
  
  // This is a hack to allow the ScoringChart to update faster.
  // These `visible` calls take a long time, and this sleep allows the ScoringChart
  // to update on its thread without this slowing it down. 
  // The sleep doesn't make this any slower than it already is though.
  await window.sleep(0);
  
  table.columns().visible(false);
  table.columns([0, 1, 2]).visible(true);
  table.columns(adjustedRange).visible(true);
  table.fixedColumns().relayout();
}

createWeeklyBreakdownTable(useNascarPoints = true) {
  console.log("abcabc createWeeklyBreakdownTable");
  let container = this.shadowRoot.querySelector("#myDataTable");
  
  // There isn't a container yet, so create one
  if (container == undefined) {
    container = document.createElement("div");
    container.id = "myDataTable";
    this.shadowRoot.appendChild(container);
  }
  // There is a container already and it's full, we don't need to do anything
  else if (container.innerHTML != "") {
    console.log("skipping createWeeklyBreakdownTable");
    return;    
  }
    
  let table = document.createElement("table");
  table.classList.add("table", "table-bordered", "table-sm");
  table.id = "weekly_breakdown_table";
  container.appendChild(table);

  $(document).ready(() => {
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
          leftColumns: 3
        }
      });
    }
    this.highlightTable();
    // This makes sure the frozen columns at the left get the highlighted colors
    dataTable.fixedColumns().relayout();
  });
}

createColumnDefinitionsForTable() {
  let columns = [
    { data: "name", title: "Team" },
    { 
      data: "Total NP", 
      title: "Total NP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, false, type)
      }
    },
    { 
      data: "Total ANP", 
      title: "Total ANP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, true, type)
      }
    }
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

renderMethodTotalField(teamData, useAdjustedPoints, type) {
  let total = 0;
  for (let week in teamData.weeklyInfo) {
    let weekData = teamData.weeklyInfo[week];
    if (useAdjustedPoints) {
      total += weekData.nascar_points + weekData.wins * this.pointsPerWin;
    }
    else {
      total += weekData.nascar_points;
    }
  }
  return total;
}

renderMethodWeekField(teamData, week, type) {
  let weekInfo = teamData.weeklyInfo[week];
  return weekInfo.nascar_points + weekInfo.wins * this.pointsPerWin;
}

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
  let maxScore=0, maxNP=0,maxTotalNP=0, maxANP=0, maxTotalANP=0;
  let minScore, minNP, minTotalNP, minANP, minTotalANP;

  let data = $('#weekly_breakdown_table').DataTable().data().each((teamInfo) => {
    let weeklyInfo = teamInfo.weeklyInfo;
    let teamTotalNP=0, teamTotalANP=0;

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
    }
    
    if (minTotalNP === undefined || minTotalANP === undefined) {
      minTotalNP = teamTotalNP;
      minTotalANP = teamTotalANP;
    }
    else {
      minTotalNP = (teamTotalNP < minTotalNP) ? teamTotalNP : minTotalNP;
      minTotalANP = (teamTotalANP < minTotalANP) ? teamTotalANP : minTotalANP;
      maxTotalNP = (teamTotalNP > maxTotalNP) ? teamTotalNP : maxTotalNP;
      maxTotalANP = (teamTotalANP > maxTotalANP) ? teamTotalANP : maxTotalANP;
    }
  });
    
  return {
    minScore: minScore,
    minNP: minNP,
    minANP: minANP,
    minTotalNP: minTotalNP,
    minTotalANP: minTotalANP,
    maxScore: maxScore,
    maxNP: maxNP,
    maxANP: maxANP,
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
