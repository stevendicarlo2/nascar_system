class WeeklyBreakdownContainer {
  root;
  table;
  toolbar;
  filterInfo;
  defaultFilterInfo;
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    let isFirstInstance = this.createItem(scoreData, pointsPerWin);
    // This is a hack because the method gets called twice and 
    // doesn't do anything the second time, so the toolbar isn't set up.
    // The "if" shouldn't be necessary, but the stuff in the "else" should stay
    if (!isFirstInstance) {
      return;
    }
    else {
      this.defaultFilterInfo = this.createDefaultFilterInfo(scoreData);
      this.table.didUpdateScoreDataFilter(this.defaultFilterInfo);
    }
  }
  
  didUpdateScoreDataFilter(filterInfo) {
    this.filterInfo = filterInfo;
    this.toolbar.updateScoreTypeFilterInfo(filterInfo.scoreTypeFilterInfo);
    this.refreshWeeklyTableToolbarHTMLItem();
    
    if (this.toolbar.weeklyToolbarInfo.useDefault) {
      this.table.didUpdateScoreDataFilter(this.defaultFilterInfo);
    }
    else {
      this.table.didUpdateScoreDataFilter(filterInfo);
    }
  }
  
  didUpdateWeeklyTableToolbar() {
    this.refreshWeeklyTableToolbarHTMLItem();
  }
  
  refreshWeeklyTableToolbarHTMLItem() {
    let existingContainer = this.root.querySelector("#WeeklyBreakdownContainer");
    let existingToolbar = existingContainer.querySelector(".btn-toolbar");
    existingContainer.removeChild(existingToolbar);
    existingContainer.appendChild(this.toolbar.htmlItem);
  }
  
  createItem(scoreData, pointsPerWin) {
    console.log("abcabc createWeeklyBreakdownContainer");
    let container = this.root.querySelector("#WeeklyBreakdownContainer");
    
    // There isn't a container yet, so create one
    if (container == undefined) {
      container = document.createElement("div");
      container.id = "WeeklyBreakdownContainer";
      this.root.appendChild(container);
    }
    // There is a container already and it's full, we don't need to do anything
    else if (container.innerHTML != "") {
      console.log("skipping createWeeklyBreakdownContainer");
      return false;    
    }
    
    this.table = new WeeklyBreakdownTable(container, scoreData, pointsPerWin);
    this.table.createWeeklyBreakdownTable();

    this.toolbar = new WeeklyTableToolbar();
    this.toolbar.addChangeSubscriber(this);
    container.appendChild(this.toolbar.htmlItem);
    return true
  }
  
  createDefaultFilterInfo(scoreData) {
    let teamNames = Object.keys(scoreData.totals);
    
    let weekMin;
    let weekMax = 0;
    let weekNames = Object.keys(scoreData.weekly_breakdown).forEach((weekName) => {
      if (weekName === "storedTime") {
        return;
      }
      else {
        let weekValue = parseInt(weekName);
        if (weekMin === undefined) {
          weekMin = weekValue;
        }
        
        weekMin = (weekValue < weekMin) ? weekValue : weekMin;
        weekMax = (weekValue > weekMax) ? weekValue : weekMax;
      }
    });
    
    return {
      teamFilterInfo: teamNames,
      scoreTypeFilterInfo: {
        includeOpponentScore: false,
        includeTeamScore: true,
        selectedPointTypes: [PointsTypeEnum.np, PointsTypeEnum.anp]
      },
      weekFilterInfo: {
        weekMin: weekMin+1,
        weekMax: weekMax+1
      }
    }
  }
}
