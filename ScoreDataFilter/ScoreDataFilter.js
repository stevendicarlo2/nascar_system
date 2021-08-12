class ScoreDataFilter {
  root;
  scoreData;
  teamFilter;
  scoreTypeFilter;
  weekFilter;
  changeSubscribers = [];
  
  constructor(root, scoreData) {
    this.root = root;
    this.scoreData = scoreData;
    this.createScoreDataFilterItem();
  }

  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }
  
  didUpdateTeamFilter() {
    this.notifySubscribers();
  }
  
  didUpdateScoreTypeFilter() {
    this.notifySubscribers();
  }

  didUpdateWeekFilter() {
    this.notifySubscribers();
  }

  notifySubscribers() {
    let teamFilterInfo = this.teamFilter.getFilterInfo();
    let scoreTypeFilterInfo = this.scoreTypeFilter.getFilterInfo();
    let weekFilterInfo = this.weekFilter.getFilterInfo();
    let filterInfo = {
      teamFilterInfo: teamFilterInfo,
      scoreTypeFilterInfo: scoreTypeFilterInfo,
      weekFilterInfo: weekFilterInfo,
    }
    
    console.log("filterInfo", filterInfo);
    
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateScoreDataFilter(filterInfo);
    });
  }

  createScoreDataFilterItem() {
    let filter = document.createElement("div");
    filter.id = "scoreDataFilter";
    this.root.appendChild(filter);
    
    this.teamFilter = new TeamFilter(filter, this.scoreData);
    this.teamFilter.addChangeSubscriber(this);
    
    this.scoreTypeFilter = new ScoreTypeFilter(filter, this.scoreData);
    this.scoreTypeFilter.addChangeSubscriber(this);
    
    this.weekFilter = new WeekRangeFilter(filter, this.scoreData);
    this.weekFilter.addChangeSubscriber(this);
  }
}