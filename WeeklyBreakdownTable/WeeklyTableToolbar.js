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
  
  createItem() {
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
    
    this.toolbar = new ButtonToolbar([standingsTypeConfig]);
    this.toolbar.addChangeSubscriber(this);
    this.htmlItem = this.toolbar.htmlItem;
  }
}
