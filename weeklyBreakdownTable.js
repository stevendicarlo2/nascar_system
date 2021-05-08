
if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

class WeeklyBreakdownTable {
  scoreData;
  pointsPerWin;
  freezeTable;
  tableElement;
  
  constructor(scoreData, pointsPerWin) {
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
    console.log("abcabc pointsPerWin:", pointsPerWin);
    this.convertScoreDataToTableStructure();
  }

recreateWeeklyBreakdownTable(useNascarPoints = true) {
  // this.removeWeeklyBreakdownTable();
  // this.createWeeklyBreakdownTable(useNascarPoints);
  console.log("abcabc recreateWeeklyBreakdownTable");
  let actualTableBefore = document.querySelector("#weekly_breakdown_table");
  console.log("abcabc actualTableBefore: ", actualTableBefore);  
  let beforeInfo = actualTableBefore.innerHTML;
  let actualBeforeInfo = (' ' + beforeInfo).slice(1);
  // console.log("abcabc actualBeforeInfo: ", actualBeforeInfo);

  this.fillTableWithData(useNascarPoints);
  this.highlightTable();

  if ($.fn.dataTable.isDataTable('#weekly_breakdown_table')) {
    console.log("abcabc is already dataTable");
    let dataTable = $('#weekly_breakdown_table').DataTable();
    let order = dataTable.order();
    console.log("abcabc order: ", order);
    dataTable.destroy();
  } 

    $('#weekly_breakdown_table').DataTable({
      "searching": false,
      "paging": false
    });
  // }
  $('.dataTables_length').addClass('bs-select');
  // console.log("abcabc tableElement: ", this.tableElement);  
  let actualTable = document.querySelector("#weekly_breakdown_table");
  console.log("abcabc actualTable: ", actualTable);  
  let afterInfo = actualTable.innerHTML;
  console.log("abcabc innerHTML is same:",  actualBeforeInfo == afterInfo);

  // this.freezeTable.update();
}

createWeeklyBreakdownTable(useNascarPoints = true) {
  console.log("abcabc createWeeklyBreakdownTable");
  let shadowRoot = document.querySelector(".shadowRoot");
  let container = shadowRoot.querySelector("#myDataTable");
  
  // There isn't a container yet, so create one
  if (container == undefined) {
    container = document.createElement("div");
    container.id = "myDataTable";
    shadowRoot.appendChild(container);
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
    if ($.fn.dataTable.isDataTable('#weekly_breakdown_table')) {
      $('#weekly_breakdown_table').DataTable();
    } else {
      $('#weekly_breakdown_table').DataTable({
        searching: false,
        paging: false,
        data: tableData,
        columns: columns
      });
    }
    // $('.dataTables_length').addClass('bs-select');
    // this.highlightTable();
  });
}

createColumnDefinitionsForTable() {
  let columns = [
    { data: "name" },
    { 
      data: "Total NP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, false, type)
      }
    },
    { 
      data: "Total ANP", 
      render: (data, type, row, meta) => {
        return this.renderMethodTotalField(row, true, type)
      }
    }
  ]

  for (let week in this.scoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    let weekColumnObject = {
      data: "Week " + (week + 1),
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
  return teamData.weeklyInfo[week].nascar_points
}

convertScoreDataToTableStructure() {
  let allDataRows = [];
  let weekly_breakdown = this.scoreData.weekly_breakdown;
  for (let team in this.scoreData.totals) {
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
  console.log("abcabc allDataRows: ", allDataRows);
  return allDataRows
}

highlightTable() {
  let minScore, minNP, minANP, minWeekScore;
  let maxScore=0, maxNP=0, maxANP=0, maxWeekScore=0;

  d3.selectAll("#weekly_breakdown_table_wrapper td").each((d, i, cells) => {
    let dataCell = cells[i];
    if (dataCell.classList.contains("NP_data")) {
      let nascarPoints = parseFloat(dataCell.textContent);
      if (minNP === undefined) {
        minNP = nascarPoints;
      } else {
        minNP = (nascarPoints < minNP) ? nascarPoints : minNP;
      }
      maxNP = (nascarPoints > maxNP) ? nascarPoints : maxNP;
    } else if (dataCell.classList.contains("ANP_data")) {
      let adjNascarPoints = parseFloat(dataCell.textContent);
      if (minANP === undefined) {
        minANP = adjNascarPoints;
      } else {
        minANP = (adjNascarPoints < minANP) ? adjNascarPoints : minANP;
      }
      maxANP = (adjNascarPoints > maxANP) ? adjNascarPoints : maxANP;
    } else if (!dataCell.classList.contains("teamName")) {
      let nascarPoints = parseFloat(dataCell.getAttribute("data-nascar-points"));
      let rawPoints = parseFloat(dataCell.getAttribute("data-raw-points"));
      if (minScore === undefined) {
        minScore = rawPoints;
      } else {
        minScore = (rawPoints < minScore) ? rawPoints : minScore;
      }
      maxScore = (rawPoints > maxScore) ? rawPoints : maxScore;

      if (minWeekScore === undefined) {
        minWeekScore = nascarPoints;
      } else {
        minWeekScore = (nascarPoints < minWeekScore) ? nascarPoints : minWeekScore;
      }
      maxWeekScore = (nascarPoints > maxWeekScore) ? nascarPoints : maxWeekScore;
    }
  });

  let badColor = "#fe7575";
  let mediumColor = "#ffff88";
  let goodColor = "#64a764";
  let colorScale = d3.scaleLinear()
  .domain([1, (maxWeekScore+1)/2, maxWeekScore])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleNP = d3.scaleLinear()
  .domain([minNP, (minNP + maxNP)/2, maxNP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleANP = d3.scaleLinear()
  .domain([minANP, (minANP+maxANP)/2, maxANP])
  .range([badColor, mediumColor, goodColor]);
  let colorScaleRaw = d3.scaleLinear()
  .domain([minScore, (minScore+maxScore)/2, maxScore])
  .range([badColor, mediumColor, goodColor]);

  d3.selectAll("#weekly_breakdown_table_wrapper td").each((d, i, cells) => {
    let dataCell = cells[i];
    let value = parseFloat(dataCell.textContent);
    let color;
    if (dataCell.classList.contains("NP_data")) {
      color = colorScaleNP(value);
    } else if (dataCell.classList.contains("ANP_data")) {
      color = colorScaleANP(value);
    } else if (!dataCell.classList.contains("teamName")) {
      if ($("#scoreTypeSwitch").is(":checked")) {
        color = colorScale(value);
      } else {
        color = colorScaleRaw(value);
      }
    }
    dataCell.style.backgroundColor = color;
  });
}
}
