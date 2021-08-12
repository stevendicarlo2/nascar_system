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
    
    let container = document.createElement("div");
    container.id = "NascarScoringDisplayer";
    this.root.appendChild(container);

    this.weeklyBreakdownTable = new WeeklyBreakdownContainer(container, this.scoreData, this.pointsPerWin);
    this.chart = new ScoringChart(container, this.scoreData, this.pointsPerWin);    
    this.dataFilter = new ScoreDataFilter(container, this.scoreData);

    this.dataFilter.addChangeSubscriber(this.weeklyBreakdownTable);
    this.dataFilter.addChangeSubscriber(this.chart);

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
    container.appendChild(refreshButton);
  }
  
  refreshDisplay() {
    let container = this.root.querySelector("#NascarScoringDisplayer");
    this.root.removeChild(container);
    this.createScoreDisplay();
  }
}
  