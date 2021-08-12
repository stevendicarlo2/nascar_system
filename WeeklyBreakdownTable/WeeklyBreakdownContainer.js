class WeeklyBreakdownContainer {
  root;
  table;
  toolbar;
  // This is used for the actual score filter info. 
  // Before it's been set, it has no team names and only uses NP
  filterInfo;
  // This is used for the default table that has all the teams 
  // and displays NP and ANP
  defaultFilterInfo;
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    this.filterInfo = this.createDefaultFilterInfo(scoreData, false, false);
    this.defaultFilterInfo = this.createDefaultFilterInfo(scoreData, true, true);

    this.createItem(scoreData, pointsPerWin);
    this.table.didUpdateScoreDataFilter(this.defaultFilterInfo);
  }
  
  didUpdateScoreDataFilter(filterInfo) {
    filterInfo.selectedInfo = this.toolbar.weeklyToolbarInfo.selectedInfo;
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
    this.didUpdateScoreDataFilter(this.filterInfo);
  }
  
  refreshWeeklyTableToolbarHTMLItem() {
    let existingContainer = this.root.querySelector("#WeeklyBreakdownContainer");
    let existingToolbar = existingContainer.querySelector(".btn-toolbar");
    existingContainer.removeChild(existingToolbar);
    existingContainer.appendChild(this.toolbar.htmlItem);
  }
  
  createItem(scoreData, pointsPerWin) {
    let container = document.createElement("div");
    container.id = "WeeklyBreakdownContainer";
    this.root.appendChild(container);
    
    this.table = new WeeklyBreakdownTable(container, scoreData, pointsPerWin, this.defaultFilterInfo);
    this.toolbar = new WeeklyTableToolbar();
    this.toolbar.addChangeSubscriber(this);
    container.appendChild(this.toolbar.htmlItem);
  }
  
  createDefaultFilterInfo(scoreData, includeTeams, includeANP) {
    let teamNames = includeTeams ? Object.keys(scoreData.totals) : [];
    let scoreTypes = includeANP ? [PointsTypeEnum.np, PointsTypeEnum.anp] : [PointsTypeEnum.np];
    
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
        selectedPointTypes: scoreTypes
      },
      weekFilterInfo: {
        weekMin: weekMin+1,
        weekMax: weekMax+1
      },
      selectedInfo: {
        pointType: PointsTypeEnum.anp,
        teamScoreType: "teamScore"
      }
    }
  }
}
