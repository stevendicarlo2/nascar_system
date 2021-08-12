class NascarScoringDisplayer {
  root;
  weeklyBreakdownTable;
  scoringChart;
  dataFilter;
  scoreData;
  pointsPerWin;
  
  constructor(root) {
    this.root = root;
    this.createScoreDisplay();
  }
  
  getScoreDataPromise() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['scoreData', 'pointsPerWin'], function(storedData) {
        resolve(storedData);
      })
    })
  }
  
  async getScoreData() {
    let storedData = await this.getScoreDataPromise();
    this.scoreData = storedData.scoreData;
    this.pointsPerWin = (storedData.pointsPerWin !== undefined) ? storedData.pointsPerWin : 14;
  }

  async createScoreDisplay() {
    await this.getScoreData();
    this.weeklyBreakdownTable = new WeeklyBreakdownContainer(this.root, this.scoreData, this.pointsPerWin);
    this.chart = new ScoringChart(this.root, this.scoreData, this.pointsPerWin);
    this.chart.insertScoringChart();
    
    this.dataFilter = new ScoreDataFilter(this.root, this.scoreData);
    this.dataFilter.addChangeSubscriber(this.weeklyBreakdownTable);
    this.dataFilter.addChangeSubscriber(this.chart);
    this.dataFilter.createScoreDataFilterItem();

    if (!this.root.querySelector(".refreshScoresButton")) {
      let refreshButton = document.createElement('button');
      refreshButton.setAttribute("type", "button");
      refreshButton.classList.add("refreshScoresButton");
      refreshButton.innerHTML = "Refresh Score Data";
      refreshButton.addEventListener("click", function() {
        chrome.runtime.sendMessage({
          action: "loadScores",
          override: "true"
        });
      });
      this.root.appendChild(refreshButton);
    }
  }
}
  