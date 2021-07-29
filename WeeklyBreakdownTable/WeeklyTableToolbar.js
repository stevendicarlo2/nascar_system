class WeeklyTableToolbar {
  toolbar;
  htmlItem;
  // scoreTypeFilterInfo: {
  //   selectedPointTypes: [PointsTypeEnum],
  //   includeTeamScore: Bool,
  //   includeOpponentScore: Bool
  // }
  scoreTypeFilterInfo;
  changeSubscribers = [];
  
  constructor() {
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
    this.notifySubscribers();
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
          selected: true
        },
        {
          displayName: "Use filters below",
          value: "filtered",
          selected: false
        },
      ],
      id: "standingsFilterSelector",
      uniqueSelection: true
    }
    configs.push(standingsTypeConfig);
    
    let filterInfo = this.scoreTypeFilterInfo;
    if (filterInfo && filterInfo.selectedPointTypes.length > 1) {
      let scoreButtons = filterInfo.selectedPointTypes.map((pointType) => {
        if (pointType === PointsTypeEnum.np) {
          return {
            displayName: "NP",
            value: PointsTypeEnum.np,
            selected: true
          }
        }
        else if (pointType === PointsTypeEnum.anp) {
          return {
            displayName: "ANP",
            value: PointsTypeEnum.anp,
            selected: false
          }
        }
        else if (pointType === PointsTypeEnum.points) {
          return {
            displayName: "Raw Points",
            value: PointsTypeEnum.points,
            selected: false
          }
        }
        else {
          console.log("Unexpected point type when making WeeklyTableToolbar:", pointType);
        }
      })

      let pointTypeConfig = {
        buttons: scoreButtons,
        id: "scoreTypeSelector",
        uniqueSelection: true
      }
      configs.push(pointTypeConfig);
    }
    
    if (filterInfo && filterInfo.includeOpponentScore && filterInfo.includeTeamScore) {
      let opponentScoreConfig = {
        buttons: [
          {
            displayName: "Show selected team's data",
            value: "teamScore",
            selected: true
          },
          {
            displayName: "Show opponent data",
            value: "oppScore",
            selected: false
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
