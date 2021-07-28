const PointsTypeEnum = Object.freeze({
  np: "np", 
  anp: "anp", 
  points: "points"
})

class ScoreTypeFilter {
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
      subscriber.didUpdateScoreTypeFilter();
    });
  }
  
  getFilterInfo() {
    let selectedPointTypeButtons = this.root.querySelector("#scoreTypeSelector").querySelectorAll("button.active");
    let teamScoreButtons = this.root.querySelector("#opponentScoreSelector").querySelectorAll("button.active");
    let includeTeamScore = false;
    let includeOpponentScore = false;
    
    teamScoreButtons.forEach((button) => {
      let buttonValue = button.getAttribute("value");
      if (buttonValue == "teamScore") {
        includeTeamScore = true;
      }
      else if (buttonValue == "oppScore") {
        includeOpponentScore = true;
      }
    })
    
    let selectedPointTypes = Array.from(selectedPointTypeButtons).map((button) => {
      return button.value;
    });
    
    return {
      selectedPointTypes: selectedPointTypes,
      includeTeamScore: includeTeamScore,
      includeOpponentScore: includeOpponentScore
    };
  }
  
  createScoreTypeFilter() {
    if (this.root.querySelector("#toolbarRoot")) {
      return null;
    }

    let toolbarRoot = document.createElement("div");
    toolbarRoot.id = "toolbarRoot";
    toolbarRoot.classList.add("btn-toolbar");
    toolbarRoot.setAttribute("role", "toolbar");
    
    let scoreTypeSelector = this.createScoreTypeSelector();
    toolbarRoot.appendChild(scoreTypeSelector);
    
    let opponentScoreSelector = this.createOpponentScoreSelector();
    toolbarRoot.appendChild(opponentScoreSelector);

    return toolbarRoot;
  }

  createScoreTypeSelector() {
    let scoreTypeRoot = document.createElement("div");
    scoreTypeRoot.id = "scoreTypeSelector";

    let config = {
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
    
    let scoreTypeButtonGroup = new ButtonGroup(config);
    scoreTypeButtonGroup.addChangeSubscriber(this);
    scoreTypeRoot.appendChild(scoreTypeButtonGroup.htmlItem);

    return scoreTypeRoot;
  }
  
  didUpdateButtonGroup() {
    this.notifySubscribers();
  }

  createOpponentScoreSelector() {
    let opponentScoreSelector = document.createElement("div");
    opponentScoreSelector.id = "opponentScoreSelector";

    let config = {
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

    let opponentScoreButtonGroup = new ButtonGroup(config);
    opponentScoreButtonGroup.addChangeSubscriber(this);
    opponentScoreSelector.appendChild(opponentScoreButtonGroup.htmlItem);
    
    return opponentScoreSelector;
  }
}