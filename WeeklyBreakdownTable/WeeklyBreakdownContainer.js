class WeeklyBreakdownContainer {
  root;
  table;
  toolbar;
  
  constructor(root, scoreData, pointsPerWin) {
    this.root = root;
    this.createItem(scoreData, pointsPerWin);
  }
  
  didUpdateScoreDataFilter(filterInfo) {
    this.table.didUpdateScoreDataFilter(filterInfo);
    this.toolbar.updateScoreTypeFilterInfo(filterInfo.scoreTypeFilterInfo);

    this.refreshWeeklyTableToolbarHTMLItem();
  }
  
  didUpdateWeeklyTableToolbar() {
    this.refreshWeeklyTableToolbarHTMLItem();
  }
  
  refreshWeeklyTableToolbarHTMLItem() {
    let existingContainer = this.root.querySelector("#WeeklyBreakdownContainer");
    let existingToolbar = existingContainer.querySelector(".btn-toolbar");
    existingContainer.removeChild(existingToolbar);
    existingContainer.appendChild(this.toolbar.htmlItem);
  }
  
  createItem(scoreData, pointsPerWin) {
    console.log("abcabc createWeeklyBreakdownContainer");
    let container = this.root.querySelector("#WeeklyBreakdownContainer");
    
    // There isn't a container yet, so create one
    if (container == undefined) {
      container = document.createElement("div");
      container.id = "WeeklyBreakdownContainer";
      this.root.appendChild(container);
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
