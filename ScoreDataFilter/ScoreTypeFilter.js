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

    let scoreTypeButtonGroup = document.createElement("div");
    scoreTypeButtonGroup.classList.add("btn-group");
    scoreTypeButtonGroup.setAttribute("role", "group");
    scoreTypeRoot.appendChild(scoreTypeButtonGroup);
    
    let scoreButtons = [];

    scoreButtons.push(new ButtonItem("NP", PointsTypeEnum.np))
    scoreButtons[0].select();
    scoreButtons.push(new ButtonItem("ANP", PointsTypeEnum.anp))
    scoreButtons.push(new ButtonItem("Raw Points", PointsTypeEnum.points))
    scoreButtons.forEach((scoreButton) => {
      scoreButton.addChangeSubscriber(this);
      scoreTypeButtonGroup.appendChild(scoreButton.htmlItem);
    })
    return scoreTypeRoot;
  }
  
  didSelectButton(value) {
    this.notifySubscribers();
  }

  createOpponentScoreSelector() {
    let opponentScoreSelector = document.createElement("div");
    opponentScoreSelector.id = "opponentScoreSelector";

    let opponentScoreButtonGroup = document.createElement("div");
    opponentScoreButtonGroup.classList.add("btn-group");
    opponentScoreButtonGroup.setAttribute("role", "group");
    opponentScoreSelector.appendChild(opponentScoreButtonGroup);
    
    let buttons = [];
    buttons.push(new ButtonItem("Show selected team's data", "teamScore"))
    buttons[0].select();
    buttons.push(new ButtonItem("Show opponent data", "oppScore"))
    buttons.forEach((button) => {
      button.addChangeSubscriber(this);
      opponentScoreButtonGroup.appendChild(button.htmlItem);
    })

    return opponentScoreSelector;
  }
}