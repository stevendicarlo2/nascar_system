class WeekRangeFilter {
  root;
  scoreData;
  changeSubscribers = [];
  
  constructor(root, scoreData) {
    this.root = root;
    this.scoreData = scoreData;
    this.createWeekRange();
  }

  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateWeekFilter();
    });
  }
  
  getFilterInfo() {
    let weekMin = $( "#weekRangeRoot .weekRange" ).slider( "values", 0 );
    let weekMax = $( "#weekRangeRoot .weekRange" ).slider( "values", 1 );
    
    return {weekMin: weekMin, weekMax: weekMax};
  }

  createWeekRange() {
    let weekRangeRoot = document.createElement("div");
    weekRangeRoot.id = "weekRangeRoot";
    
    let weekRange = document.createElement("div");
    weekRange.classList.add("weekRange");
    weekRangeRoot.appendChild(weekRange);
    
    this.root.appendChild(weekRangeRoot)
    // The jquery modification in this method has to be done after appending the child into the DOM,
    // it doesn't work when doing it before adding it to the DOM.
    this.customizeWeekRange();
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