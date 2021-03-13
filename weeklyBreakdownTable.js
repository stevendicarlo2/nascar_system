
if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

class WeeklyBreakdownTable {
  scoreData;
  pointsPerWin;
  
  constructor(scoreData, pointsPerWin) {
    this.scoreData = scoreData;
    this.pointsPerWin = pointsPerWin;
  }

removeWeeklyBreakdownTable() {
  let existingTable = document.querySelector("#myDataTable");
  if (existingTable.innerHTML != "") {
    existingTable.innerHTML = ""
  }
  
  let existingScoreSwitchLabel = document.querySelector("#scoreTypeSwitchLabel");
  if (existingScoreSwitchLabel) {
    existingScoreSwitchLabel.parentNode.removeChild(existingScoreSwitchLabel);
  }
  
  let existingScoreSwitch = document.querySelector("#scoreTypeSwitch");
  if (existingScoreSwitch) {
    let scoreSwitchParent = existingScoreSwitch.parentNode;
    scoreSwitchParent.parentNode.removeChild(scoreSwitchParent);
  }
}

recreateWeeklyBreakdownTable(useNascarPoints = true) {
  this.removeWeeklyBreakdownTable();
  this.createWeeklyBreakdownTable(useNascarPoints);
}

createWeeklyBreakdownTable(useNascarPoints = true) {
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
  let thead = document.createElement("thead");
  table.appendChild(thead);
  let headRow = document.createElement("tr");
  thead.appendChild(headRow);
  let ownerCol = document.createElement("th");
  ownerCol.classList.add("th-sm");
  ownerCol.innerHTML = "Team";
  headRow.appendChild(ownerCol);
  let totalCol = document.createElement("th");
  totalCol.classList.add("th-sm");
  totalCol.innerHTML = "Total NP";
  headRow.appendChild(totalCol);
  let adjCol = document.createElement("th");
  adjCol.classList.add("th-sm");
  adjCol.innerHTML = "Total ANP";
  headRow.appendChild(adjCol);
  for (let week in this.scoreData.weekly_breakdown) {
    if (week === "storedTime") {
      continue;
    }
    let weekCol = document.createElement("th");
    weekCol.classList.add("th-sm");
    weekCol.innerHTML = "Week " + (parseInt(week) + 1).toString();
    headRow.appendChild(weekCol);
  }

  // Filling with data
  let tbody = document.createElement("tbody");
  table.appendChild(tbody);
  for (let team in this.scoreData.totals) {
    let row = document.createElement("tr");
    let nameEntry = document.createElement("td");
    nameEntry.classList.add("teamName");
    nameEntry.innerHTML = team;
    row.appendChild(nameEntry);
    let totEntry = document.createElement("td");
    totEntry.classList.add("NP_data");
    totEntry.innerHTML = "<b>" + this.scoreData.totals[team].total_NP + "</b>";
    row.appendChild(totEntry);
    let adjEntry = document.createElement("td");
    adjEntry.classList.add("ANP_data");
    adjEntry.innerHTML = "<b>" + (this.scoreData.totals[team].total_NP + this.scoreData.totals[team].wins*this.pointsPerWin) + "</b>";
    row.appendChild(adjEntry);
    for (let week in this.scoreData.weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      let info = this.scoreData.weekly_breakdown[week][team];
      let entry = document.createElement("td");
      entry.setAttribute("data-nascar-points", info.nascar_points + info.wins*this.pointsPerWin);
      entry.setAttribute("data-raw-points", info.score);
      entry.setAttribute("data-wins", info.wins);
      entry.innerHTML = useNascarPoints ? info.nascar_points + info.wins*this.pointsPerWin : info.score;
      if (info.wins === 1) {
        entry.innerHTML = "<u>" + entry.innerHTML + "</u>";
      }
      entry.classList.add("weeklyData");
      row.appendChild(entry);
    }
    tbody.appendChild(row);
  }
  if (useNascarPoints) {
    container.innerHTML += '<label id="scoreTypeSwitchLabel" for="scoreTypeSwitch">Nascar Points</label><label class="switch"><input id="scoreTypeSwitch" type="checkbox" checked><span class="slider round"></span></label>';
  } else {
    container.innerHTML += '<label id="scoreTypeSwitchLabel" for="scoreTypeSwitch">Weekly Score</label><label class="switch"><input id="scoreTypeSwitch" type="checkbox"><span class="slider round"></span></label>';
  }
  

  $(document).ready(() => {
    if ($.fn.dataTable.isDataTable('#weekly_breakdown_table')) {
      $('#weekly_breakdown_table').DataTable();
    } else {
      $('#weekly_breakdown_table').DataTable({
        "searching": false,
        "paging": false,
        "order": [[ 2, "desc" ]]
      });
    }
    $('.dataTables_length').addClass('bs-select');
    $('#weekly_breakdown_table').parent().addClass('freezeTable');
    var freezeTable = new FreezeTable('.freezeTable', {
      "columnNum": 3, 
      "columnWrapStyles": {'border-right': '3px solid black'},
      "freezeColumnHead": false,
      "freezeHead": false
    });

    let addHandlerToBreakdownHeader = (header, isOriginal) => {
      if (header.getAttribute("sort_handler_exists") !== "true") {
        header.setAttribute("sort_handler_exists", "true");
        header.addEventListener("click", () => {
          if (!isOriginal) {
            let originalHeader = $( "#weekly_breakdown_table th:contains('" + header.textContent + "')" );
            originalHeader.click();
          }
          let oldTableCopy = document.querySelector("#weekly_breakdown_table_wrapper .clone-column-table-wrap table");
          let oldTableStyle = oldTableCopy.style.cssText;
          let newTableCopy = document.getElementById("weekly_breakdown_table").cloneNode(true);
          newTableCopy.removeAttribute("id");
          newTableCopy.style.cssText = oldTableStyle;
          newTableCopy.querySelectorAll("th").forEach((header) => {
            header.removeAttribute("sort_handler_exists");
          });

          let tableParent = oldTableCopy.parentNode;
          tableParent.removeChild(oldTableCopy);
          tableParent.appendChild(newTableCopy);
          addHandlersToAllBreakdownHeaders();
        });
      }
    }

    let addHandlersToAllBreakdownHeaders = () => {
      let copiedHeaders = document.querySelectorAll('#weekly_breakdown_table_wrapper .clone-column-table-wrap th');
      copiedHeaders.forEach((header) => {
        addHandlerToBreakdownHeader(header, false);
      });
      let originalHeaders = document.querySelectorAll('#weekly_breakdown_table th');
      originalHeaders.forEach((header) => {
        addHandlerToBreakdownHeader(header, true);
      });
    }
    addHandlersToAllBreakdownHeaders();
    let targetNode = document.querySelector('#weekly_breakdown_table_wrapper .clone-column-table-wrap');
    let observer = new MutationObserver(() => {
        if(targetNode.style.visibility === 'visible') {
          addHandlersToAllBreakdownHeaders();
        }
    });
    observer.observe(targetNode, { attributes: true, childList: true });

    let scoreTypeSwitch = $("#scoreTypeSwitch");
    scoreTypeSwitch.click(() => {
      let checked = scoreTypeSwitch.prop("checked");
      $("#scoreTypeSwitchLabel").html(checked ? "Nascar Points" : "Weekly Score");
      this.recreateWeeklyBreakdownTable(checked);
    });
    this.highlightTable();
  });
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
