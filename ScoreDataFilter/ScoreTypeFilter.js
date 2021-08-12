const PointsTypeEnum = Object.freeze({
  np: "np", 
  anp: "anp", 
  points: "points"
})

class ScoreTypeFilter {
  root;
  scoreData;
  toolbar;
  changeSubscribers = [];
  
  constructor(root, scoreData) {
    this.root = root;
    this.scoreData = scoreData;
    this.createScoreTypeFilter();
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateScoreTypeFilter();
    });
  }
  
  getFilterInfo() {
    let toolbarInfo = this.toolbar.getButtonToolbarInfo();
    let selectedPointTypes = [];
    let includeTeamScore = false;
    let includeOpponentScore = false;
    
    toolbarInfo.forEach((groupInfo) => {
      if (groupInfo.id === "scoreTypeSelector") {
        groupInfo.buttons.forEach((buttonInfo) => {
          if (buttonInfo.selected) {
            selectedPointTypes.push(buttonInfo.value);
          }
        })
      }
      else if (groupInfo.id === "opponentScoreSelector") {
        groupInfo.buttons.forEach((buttonInfo) => {
          if (buttonInfo.value === "teamScore") {
            includeTeamScore = buttonInfo.selected;
          }
          else if (buttonInfo.value === "oppScore") {
            includeOpponentScore = buttonInfo.selected;
          }
          else {
            console.log("Unexpected button in opponentScoreSelector: ", buttonInfo.value);
          }
        })
      }
      else {
        console.log("Unexpected button group in toolbar: ", groupInfo.id);
      }
    })
    
    return {
      selectedPointTypes: selectedPointTypes,
      includeTeamScore: includeTeamScore,
      includeOpponentScore: includeOpponentScore
    };
  }
  
  createScoreTypeFilter() {
    let scoreTypeConfig = {
      buttons: [
        {
          displayName: "NP",
          value: PointsTypeEnum.np,
          selected: true
        },
        {
          displayName: "ANP",
          value: PointsTypeEnum.anp,
          selected: false
        },
        {
          displayName: "Raw Points",
          value: PointsTypeEnum.points,
          selected: false
        }
      ],
      id: "scoreTypeSelector",
      uniqueSelection: false
    }
    
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
      uniqueSelection: false
    }
    
    this.toolbar = new ButtonToolbar([scoreTypeConfig, opponentScoreConfig]);
    this.toolbar.addChangeSubscriber(this);
    this.root.appendChild(this.toolbar.htmlItem);
  }
  
  didUpdateButtonToolbar() {
    this.notifySubscribers();
  }
}