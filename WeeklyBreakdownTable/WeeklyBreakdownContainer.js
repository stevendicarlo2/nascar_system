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
  changeSubscribers = [];
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    this.filterInfo = this.createDefaultFilterInfo(scoreData, false, false);
    this.defaultFilterInfo = this.createDefaultFilterInfo(scoreData, true, true);

    this.createItem(scoreData, pointsPerWin);
    this.table.didUpdateScoreDataFilter(this.defaultFilterInfo);
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribersWeeklyTableUpdate() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didFinishDisplayingWeeklyTable();
    });
  }
  
  notifySubscribersWeeklyToolbarUpdate() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateWeeklyTableToolbar();
    });
  }
  
  didFinishDisplayingWeeklyTable() {
    this.notifySubscribersWeeklyTableUpdate();
  }
  
  didUpdateScoreDataFilter(filterInfo) {
    this.filterInfo = filterInfo;
    this.filterInfo.selectedInfo = this.toolbar.weeklyToolbarInfo.selectedInfo;
    
    // If the selected pointType is no longer available because the scoreTypeFilterInfo changed,
    // then change the selectedInfo to what is now available.
    if (!this.filterInfo.scoreTypeFilterInfo.selectedPointTypes.includes(this.filterInfo.selectedInfo.pointType)) {
      let firstSelectedPointType = this.filterInfo.scoreTypeFilterInfo.selectedPointTypes[0];
      // If none are selected, just use NP
      if (!firstSelectedPointType) {
        firstSelectedPointType = PointsTypeEnum.np;
      }
      this.filterInfo.selectedInfo.pointType = firstSelectedPointType;
    }
    // If the filters include only the opponent score, make that the selected one
    if (
      !this.filterInfo.scoreTypeFilterInfo.includeTeamScore &&
      this.filterInfo.scoreTypeFilterInfo.includeOpponentScore
    ) {
      this.filterInfo.selectedInfo.teamScoreType = "oppScore";
    }
    // Otherwise, if the opponent score isn't selected (whether or not the team score is),
    // it should default to showing the teamScore
    else if (!this.filterInfo.scoreTypeFilterInfo.includeOpponentScore) {
      this.filterInfo.selectedInfo.teamScoreType = "teamScore";
    }

    // Now this method just updates the necessary elements with the updated filterInfo
    this.toolbar.updateScoreTypeFilterInfo(this.filterInfo.scoreTypeFilterInfo);
    this.refreshWeeklyTableToolbarHTMLItem();
    
    if (this.toolbar.weeklyToolbarInfo.useDefault) {
      this.table.didUpdateScoreDataFilter(this.defaultFilterInfo);
    }
    else {
      this.table.didUpdateScoreDataFilter(this.filterInfo);
    }
  }
  
  didUpdateWeeklyTableToolbar() {
    this.notifySubscribersWeeklyToolbarUpdate();
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
    this.table.addChangeSubscriber(this);
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
