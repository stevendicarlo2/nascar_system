class WeekRangeFilter {
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

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateWeekFilter();
    });
  }

  createWeekRange() {
    if (this.root.querySelector("#weekRangeRoot")) {
      return null;
    }

    let weekRangeRoot = document.createElement("div");
    weekRangeRoot.id = "weekRangeRoot";
    
    let weekRange = document.createElement("div");
    weekRange.classList.add("weekRange");
    weekRangeRoot.appendChild(weekRange);
    
    return weekRangeRoot;
  }

  customizeWeekRange() {
    // Subtract one here because one of the keys is for the last stored time
    let numberOfWeeks = Object.keys(this.scoreData.weekly_breakdown).length - 1;

    $( "#weekRangeRoot .weekRange" ).slider({
      change: (event, ui) => { 
        this.notifySubscribers();
      },
      min: 1,
      max: numberOfWeeks,
      range: true,
      values: [1, numberOfWeeks]
    });
    
    let weekRangeRoot = this.root.querySelector("#weekRangeRoot");
    let weekRangeLabelContainer = document.createElement("div");
    weekRangeLabelContainer.classList.add("weekRangeLabelContainer");
    for (let i = 1; i <= numberOfWeeks; i++) {
      let weekRangeLabel = document.createElement("div");
      weekRangeLabel.classList.add("weekRangeLabel");
      weekRangeLabel.innerHTML = i;
      weekRangeLabelContainer.appendChild(weekRangeLabel);
    }
    weekRangeRoot.appendChild(weekRangeLabelContainer);
  }
}