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
    $(document).ready(() => {
      let existingFilter = this.root.querySelector("#scoreDataFilter");
      
      if (existingFilter != undefined) {
        console.log("skipping createScoreDataFilterItem");
        return
      }

      let filter = document.createElement("div");
      filter.id = "scoreDataFilter";
      this.root.appendChild(filter);
      
      this.teamFilter = new TeamFilter(this.root, this.scoreData);
      this.teamFilter.addChangeSubscriber(this);
      let teamFilterItem = this.teamFilter.createTeamFilterItem();
      if (teamFilterItem != null) {
        filter.appendChild(teamFilterItem);
      }
      
      this.scoreTypeFilter = new ScoreTypeFilter(this.root, this.scoreData);
      this.scoreTypeFilter.addChangeSubscriber(this);
      let scoreTypeFilterItem = this.scoreTypeFilter.createScoreTypeFilter();
      if (scoreTypeFilterItem != null) {
        filter.appendChild(scoreTypeFilterItem);
      }
      
      this.weekFilter = new WeekRangeFilter(this.root, this.scoreData);
      this.weekFilter.addChangeSubscriber(this);
      let weekFilterItem = this.weekFilter.createWeekRange();
      if (weekFilterItem != null) {
        filter.appendChild(weekFilterItem);
        // The jquery modification in this method has to be done after appending the child into the DOM,
        // it doesn't work when doing it before adding it to the DOM.
        this.weekFilter.customizeWeekRange();
      }
    })
  }
}