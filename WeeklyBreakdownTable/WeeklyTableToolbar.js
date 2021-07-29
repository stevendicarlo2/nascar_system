class WeeklyTableToolbar {
  toolbar;
  htmlItem;
  // scoreTypeFilterInfo: {
  //   selectedPointTypes: [PointsTypeEnum],
  //   includeTeamScore: Bool,
  //   includeOpponentScore: Bool
  // }
  scoreTypeFilterInfo;
  // weeklyToolbarInfo: {
  //   useDefault: Bool,
  //   selectedInfo: {
  //     pointType: PointsTypeEnum,
  //     teamScoreType: String, either "oppScore" or "teamScore"
  //   }
  // }
  weeklyToolbarInfo;
  changeSubscribers = [];
  
  constructor() {
    this.weeklyToolbarInfo = {
      useDefault: true,
      selectedInfo: {
        pointType: PointsTypeEnum.np,
        teamScoreType: "teamScore"
      }
    };
    this.createItem();
  }

  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateWeeklyTableToolbar();
    });
  }
  
  didUpdateButtonToolbar() {
    this.updateWeeklyToolbarInfo();
    this.createItem();
    this.notifySubscribers();
  }
  
  updateWeeklyToolbarInfo() {
    let toolbarInfo = this.toolbar.getButtonToolbarInfo();

    toolbarInfo.forEach((groupInfo) => {
      if (groupInfo.id == "standingsFilterSelector") {
        this.weeklyToolbarInfo.useDefault = groupInfo.buttons[0].selected;
      }
      else if (groupInfo.id == "scoreTypeSelector") {
        let selectedButton = groupInfo.buttons.find((button) => {
          return button.selected;
        })
        if (selectedButton) {
          this.weeklyToolbarInfo.selectedInfo.pointType = selectedButton.value;
        }
      }
      else if (groupInfo.id == "opponentScoreSelector") {
        let selectedButton = groupInfo.buttons.find((button) => {
          return button.selected;
        })
        if (selectedButton) {
          this.weeklyToolbarInfo.selectedInfo.teamScoreType = selectedButton.value;
        }
      }
    })
  }
  
  updateScoreTypeFilterInfo(scoreTypeFilterInfo) {
    this.scoreTypeFilterInfo = scoreTypeFilterInfo;
    this.createItem();
  }
  
  createItem() {    
    let configs = [];
    let standingsTypeConfig = {
      buttons: [
        {
          displayName: "Default standings",
          value: "defaultStandings",
          selected: this.weeklyToolbarInfo.useDefault
        },
        {
          displayName: "Use filters below",
          value: "filtered",
          selected: !this.weeklyToolbarInfo.useDefault
        },
      ],
      id: "standingsFilterSelector",
      uniqueSelection: true
    }
    configs.push(standingsTypeConfig);
    
    let filterInfo = this.scoreTypeFilterInfo;
    if (!this.weeklyToolbarInfo.useDefault && 
      filterInfo && 
      filterInfo.selectedPointTypes.length > 1
    ) {
      let scoreButtons = filterInfo.selectedPointTypes.map((pointType) => {
        if (pointType === PointsTypeEnum.np) {
          return {
            displayName: "NP",
            value: PointsTypeEnum.np,
            selected: this.weeklyToolbarInfo.selectedInfo.pointType === PointsTypeEnum.np
          }
        }
        else if (pointType === PointsTypeEnum.anp) {
          return {
            displayName: "ANP",
            value: PointsTypeEnum.anp,
            selected: this.weeklyToolbarInfo.selectedInfo.pointType === PointsTypeEnum.anp
          }
        }
        else if (pointType === PointsTypeEnum.points) {
          return {
            displayName: "Raw Points",
            value: PointsTypeEnum.points,
            selected: this.weeklyToolbarInfo.selectedInfo.pointType === PointsTypeEnum.points
          }
        }
        else {
          console.log("Unexpected point type when making WeeklyTableToolbar:", pointType);
        }
      })
      
      // It's possible for none to be selected if the one selected previously
      // that has since been removed from the availble options.
      // In that case select the new first one in the list.
      let selectedScoreButton = scoreButtons.find((button) => {
        return button.selected;
      })
      if (!selectedScoreButton) {
        scoreButtons[0].selected = true;
        this.weeklyToolbarInfo.selectedInfo.pointType = scoreButtons[0].value;
      }

      let pointTypeConfig = {
        buttons: scoreButtons,
        id: "scoreTypeSelector",
        uniqueSelection: true
      }
      configs.push(pointTypeConfig);
    }
    
    if (!this.weeklyToolbarInfo.useDefault && 
      filterInfo && 
      filterInfo.includeOpponentScore && 
      filterInfo.includeTeamScore) 
    {
      let opponentScoreConfig = {
        buttons: [
          {
            displayName: "Show selected team's data",
            value: "teamScore",
            selected: this.weeklyToolbarInfo.selectedInfo.teamScoreType === "teamScore"
          },
          {
            displayName: "Show opponent data",
            value: "oppScore",
            selected: this.weeklyToolbarInfo.selectedInfo.teamScoreType === "oppScore"
          }
        ],
        id: "opponentScoreSelector",
        uniqueSelection: true
      }
      configs.push(opponentScoreConfig)
    }
    
    this.toolbar = new ButtonToolbar(configs);
    this.toolbar.addChangeSubscriber(this);
    this.htmlItem = this.toolbar.htmlItem;
  }
}
