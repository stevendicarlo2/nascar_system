
if (!window.tableContentsHash) {
  window.tableContentsHash = 0;
}

function removeWeeklyBreakdownTable() {
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

function recreateWeeklyBreakdownTable(useNascarPoints = true) {
  let origTable = document.querySelector("#weekly_breakdown_table");
  let scoreDataString = origTable.getAttribute("data-scoreData");
  let pointsPerWinString = origTable.getAttribute("data-pointsPerWin");
  let scoreData = JSON.parse(scoreDataString);
  let pointsPerWin = parseInt(pointsPerWinString);
  removeWeeklyBreakdownTable();
  createWeeklyBreakdownTable(scoreData, pointsPerWin, useNascarPoints);
}

function createWeeklyBreakdownTable(scoreData, pointsPerWin, useNascarPoints = true) {
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
  table.setAttribute("data-scoreData", JSON.stringify(scoreData));
  table.setAttribute("data-pointsPerWin", pointsPerWin);
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
  for (let week in scoreData.weekly_breakdown) {
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
  for (let team in scoreData.totals) {
    let row = document.createElement("tr");
    let nameEntry = document.createElement("td");
    nameEntry.classList.add("teamName");
    nameEntry.innerHTML = team;
    row.appendChild(nameEntry);
    let totEntry = document.createElement("td");
    totEntry.classList.add("NP_data");
    totEntry.innerHTML = "<b>" + scoreData.totals[team].total_NP + "</b>";
    row.appendChild(totEntry);
    let adjEntry = document.createElement("td");
    adjEntry.classList.add("ANP_data");
    adjEntry.innerHTML = "<b>" + (scoreData.totals[team].total_NP + scoreData.totals[team].wins*pointsPerWin) + "</b>";
    row.appendChild(adjEntry);
    for (let week in scoreData.weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      let info = scoreData.weekly_breakdown[week][team];
      let entry = document.createElement("td");
      entry.setAttribute("data-nascar-points", info.nascar_points + info.wins*pointsPerWin);
      entry.setAttribute("data-raw-points", info.score);
      entry.setAttribute("data-wins", info.wins);
      entry.innerHTML = useNascarPoints ? info.nascar_points + info.wins*pointsPerWin : info.score;
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
  

  $(document).ready(function () {
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

    let addHandlerToBreakdownHeader = function(header, isOriginal) {
      if (header.getAttribute("sort_handler_exists") !== "true") {
        header.setAttribute("sort_handler_exists", "true");
        header.addEventListener("click", function() {
          if (!isOriginal) {
            let originalHeader = $( "#weekly_breakdown_table th:contains('" + this.textContent + "')" );
            originalHeader.click();
          }
          let oldTableCopy = document.querySelector("#weekly_breakdown_table_wrapper .clone-column-table-wrap table");
          let oldTableStyle = oldTableCopy.style.cssText;
          let newTableCopy = document.getElementById("weekly_breakdown_table").cloneNode(true);
          newTableCopy.removeAttribute("id");
          newTableCopy.style.cssText = oldTableStyle;
          newTableCopy.querySelectorAll("th").forEach(function(header) {
            header.removeAttribute("sort_handler_exists");
          });

          let tableParent = oldTableCopy.parentNode;
          tableParent.removeChild(oldTableCopy);
          tableParent.appendChild(newTableCopy);
          addHandlersToAllBreakdownHeaders();
        });
      }
    }

    let addHandlersToAllBreakdownHeaders = function() {
      let copiedHeaders = document.querySelectorAll('#weekly_breakdown_table_wrapper .clone-column-table-wrap th');
      copiedHeaders.forEach(function(header) {
        addHandlerToBreakdownHeader(header, false);
      });
      let originalHeaders = document.querySelectorAll('#weekly_breakdown_table th');
      originalHeaders.forEach(function(header) {
        addHandlerToBreakdownHeader(header, true);
      });
    }
    addHandlersToAllBreakdownHeaders();
    let targetNode = document.querySelector('#weekly_breakdown_table_wrapper .clone-column-table-wrap');
    let observer = new MutationObserver(function(){
        if(targetNode.style.visibility === 'visible') {
          addHandlersToAllBreakdownHeaders();
        }
    });
    observer.observe(targetNode, { attributes: true, childList: true });

    $("#scoreTypeSwitch").click(function() {
      $("#scoreTypeSwitchLabel").html(this.checked ? "Nascar Points" : "Weekly Score");
      recreateWeeklyBreakdownTable(this.checked);
    });
    highlightTable();
  });
}

// function fillTableWithData(useNascarPoints) {
//   $(document).ready(function () {
//     $("#weekly_breakdown_table_wrapper td").each(function(i) {
//       if (!(this.classList.contains("NP_data") || this.classList.contains("ANP_data") || this.classList.contains("teamName"))) {
//         if (useNascarPoints) {
//           this.innerHTML = this.getAttribute("data-nascar-points");
//         } else {
//           this.innerHTML = this.getAttribute("data-raw-points");
//         }
//         if (this.getAttribute("data-wins") === "1") {
//           this.innerHTML = "<u>" + this.innerHTML + "</u>";
//         }
//       }
//     });
//     highlightTable();
//   });
// }

function highlightTable() {
  let minScore, minNP, minANP, minWeekScore;
  let maxScore=0, maxNP=0, maxANP=0, maxWeekScore=0;

  d3.selectAll("#weekly_breakdown_table_wrapper td").each(function(d, i) {
    if (this.classList.contains("NP_data")) {
      let nascarPoints = parseFloat(this.textContent);
      if (minNP === undefined) {
        minNP = nascarPoints;
      } else {
        minNP = (nascarPoints < minNP) ? nascarPoints : minNP;
      }
      maxNP = (nascarPoints > maxNP) ? nascarPoints : maxNP;
    } else if (this.classList.contains("ANP_data")) {
      let adjNascarPoints = parseFloat(this.textContent);
      if (minANP === undefined) {
        minANP = adjNascarPoints;
      } else {
        minANP = (adjNascarPoints < minANP) ? adjNascarPoints : minANP;
      }
      maxANP = (adjNascarPoints > maxANP) ? adjNascarPoints : maxANP;
    } else if (!this.classList.contains("teamName")) {
      let nascarPoints = parseFloat(this.getAttribute("data-nascar-points"));
      let rawPoints = parseFloat(this.getAttribute("data-raw-points"));
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

  d3.selectAll("#weekly_breakdown_table_wrapper td").each(function(d, i) {
    let value = parseFloat(this.textContent);
    let color;
    if (this.classList.contains("NP_data")) {
      color = colorScaleNP(value);
    } else if (this.classList.contains("ANP_data")) {
      color = colorScaleANP(value);
    } else if (!this.classList.contains("teamName")) {
      if ($("#scoreTypeSwitch").is(":checked")) {
        color = colorScale(value);
      } else {
        color = colorScaleRaw(value);
      }
    }
    this.style.backgroundColor = color;
  });
}