class TeamFilter {
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
      subscriber.didUpdateTeamFilter();
    });
  }

  createTeamFilterItem() {
    if (this.root.querySelector("#teamFilter")) {
      return null;
    }
    let selectorRoot = document.createElement("div");
    selectorRoot.id = "teamFilter";
    
    var listRoot = document.createElement("ul");
    selectorRoot.appendChild(listRoot);
    listRoot.classList.add("list-group", "team-filter-group");
    
    // There are 3 roughly equally-sized columns of teams in the selector
    var heightCounter = 0;
    let teamCount = Object.keys(this.scoreData.totals).length;
    let maxHeight = Math.ceil(teamCount/3);
    for (let team in this.scoreData.totals) {
      if (heightCounter >= maxHeight) {
        listRoot = document.createElement("ul");
        selectorRoot.appendChild(listRoot);
        listRoot.classList.add("list-group", "team-filter-group");
        heightCounter = 0;
      }
      
      let teamOption = document.createElement("li");
      teamOption.classList.add("list-group-item");
      teamOption.innerHTML = team;
      teamOption.setAttribute("value", team);
      teamOption.onclick = () => {
        if (teamOption.classList.contains("active")) {
          teamOption.classList.remove("active");
        }
        else {
          teamOption.classList.add("active");
        }
        this.notifySubscribers();
      };

      heightCounter += 1;
      listRoot.appendChild(teamOption);
    }
    
    return selectorRoot
  }
}