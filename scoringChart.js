

function insertScoringChart(scoreData, pointsPerWin) {
  $(document).ready(function () {
    console.log("in insertScoringChart");
    var ctx = document.getElementById('myChart').getContext('2d');
    var chartLabels = []
    for (let week in scoreData.weekly_breakdown) {
      if (week === "storedTime") {
        continue;
      }
      chartLabels.push(week)
    }

    var chartDataSets = []
    for (let team in scoreData.totals) {
      var teamDataSet = {
        label: team,
        borderColor: [Math.floor(Math.random()*16777215).toString(16)],
        borderWidth: 1
      }
      var teamData = []
      for (let week in scoreData.weekly_breakdown) {
        if (week === "storedTime") {
          continue;
        }
        let info = scoreData.weekly_breakdown[week][team];
        teamData.push(info.nascar_points)
      }
      teamDataSet.data = teamData
      chartDataSets.push(teamDataSet)
    }
    
    console.log("chartDataSets:");
    console.log(chartDataSets);
    
    
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: chartLabels,
          datasets: chartDataSets
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: false
                  }
              }]
          }
      }

    });
  }
)}