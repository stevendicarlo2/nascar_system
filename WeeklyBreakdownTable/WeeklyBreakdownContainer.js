class WeeklyBreakdownContainer {
  table;
  toolbar;
  
  constructor(root, scoreData, pointsPerWin) {
    this.createItem(root, scoreData, pointsPerWin);
  }
  
  didUpdateScoreDataFilter(filterInfo) {
    this.table.didUpdateScoreDataFilter(filterInfo);
  }
  
  didUpdateWeeklyTableToolbar() {
    console.log("abcabc here");
  }
  
  createItem(root, scoreData, pointsPerWin) {
    console.log("abcabc createWeeklyBreakdownContainer");
    let container = root.querySelector("#WeeklyBreakdownContainer");
    
    // There isn't a container yet, so create one
    if (container == undefined) {
      container = document.createElement("div");
      container.id = "WeeklyBreakdownContainer";
      root.appendChild(container);
    }
    // There is a container already and it's full, we don't need to do anything
    else if (container.innerHTML != "") {
      console.log("skipping createWeeklyBreakdownContainer");
      return;    
    }
    
    this.table = new WeeklyBreakdownTable(container, scoreData, pointsPerWin);
    this.table.createWeeklyBreakdownTable();

    this.toolbar = new WeeklyTableToolbar();
    this.toolbar.addChangeSubscriber(this);
    container.appendChild(this.toolbar.htmlItem);
  }
}
