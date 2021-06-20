class ScoreDataFilter {
  root;
  scoreData;
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
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateScoreDataFilter();
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
      
      let teamFilter = new TeamFilter(this.root, this.scoreData);
      teamFilter.addChangeSubscriber(this);
      let teamFilterItem = teamFilter.createTeamFilterItem();
      if (teamFilterItem != null) {
        filter.appendChild(teamFilterItem);
      }
      
      let scoreTypeFilter = new ScoreTypeFilter(this.root, this.scoreData);
      scoreTypeFilter.addChangeSubscriber(this);
      let scoreTypeFilterItem = scoreTypeFilter.createScoreTypeFilter();
      if (scoreTypeFilterItem != null) {
        filter.appendChild(scoreTypeFilterItem);
      }
      
      let weekRange = new WeekRangeFilter(this.root, this.scoreData);
      weekRange.addChangeSubscriber(this);
      let weekRangeItem = weekRange.createWeekRange();
      if (weekRangeItem != null) {
        filter.appendChild(weekRangeItem);
        // The jquery modification in this method has to be done after appending the child into the DOM,
        // it doesn't work when doing it before adding it to the DOM.
        weekRange.customizeWeekRange();
      }
    })
  }
}