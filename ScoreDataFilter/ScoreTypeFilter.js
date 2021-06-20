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
    
    var scoreButtons = [];

    let npScoreButton = document.createElement("button");
    npScoreButton.innerHTML = "NP";
    npScoreButton.setAttribute("value", PointsTypeEnum.np)
    npScoreButton.classList.add("active");
    scoreButtons.push(npScoreButton);
    
    let anpScoreButton = document.createElement("button");
    anpScoreButton.innerHTML = "ANP";
    anpScoreButton.setAttribute("value", PointsTypeEnum.anp)
    scoreButtons.push(anpScoreButton);
    
    let rawPointsScoreButton = document.createElement("button");
    rawPointsScoreButton.innerHTML = "Raw Points";
    rawPointsScoreButton.setAttribute("value", PointsTypeEnum.points)
    scoreButtons.push(rawPointsScoreButton);
    
    scoreButtons.forEach((scoreButton) => {
      scoreButton.classList.add("btn", "btn-secondary");
      scoreButton.setAttribute("type", "button");
      scoreButton.setAttribute("data-toggle", "button");
      scoreButton.onclick = () => {
        if (scoreButton.classList.contains("active")) {
          scoreButton.classList.remove("active");
        }
        else {
          scoreButton.classList.add("active");
        }
        
        this.notifySubscribers();
      };
      scoreTypeButtonGroup.appendChild(scoreButton);
    })

    return scoreTypeRoot;
  }

  createOpponentScoreSelector() {
    let opponentScoreSelector = document.createElement("div");
    opponentScoreSelector.id = "opponentScoreSelector";

    let opponentScoreButtonGroup = document.createElement("div");
    opponentScoreButtonGroup.classList.add("btn-group");
    opponentScoreButtonGroup.setAttribute("role", "group");
    opponentScoreSelector.appendChild(opponentScoreButtonGroup);
    
    let buttons = [];

    let teamScoreButton = document.createElement("button");
    teamScoreButton.innerHTML = "Show selected team's data";
    teamScoreButton.classList.add("active");
    teamScoreButton.setAttribute("value", "teamScore");
    buttons.push(teamScoreButton);

    let opponentScoreButton = document.createElement("button");
    opponentScoreButton.innerHTML = "Show opponent data";
    opponentScoreButton.setAttribute("value", "oppScore");
    buttons.push(opponentScoreButton);
    
    buttons.forEach((button) => {
      button.classList.add("btn", "btn-secondary");
      button.setAttribute("type", "button");
      button.setAttribute("data-toggle", "button");
      button.onclick = () => {
        if (button.classList.contains("active")) {
          button.classList.remove("active");
        }
        else {
          button.classList.add("active");
        }
        
        this.notifySubscribers();
      };
      opponentScoreButtonGroup.appendChild(button);
    })

    return opponentScoreSelector;
  }
}