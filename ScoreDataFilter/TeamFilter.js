class TeamFilter {
  root;
  scoreData;
  changeSubscribers = [];
  
  constructor(root, scoreData) {
    this.root = root;
    this.scoreData = scoreData;
    this.createTeamFilterItem();
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }
  
  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateTeamFilter();
    });
  }
  
  getFilterInfo() {
    let filter = this.root.querySelector("#teamFilter");
    let teamOptions = Array.from(filter.querySelectorAll("li"));
    let teamNames = teamOptions.filter((teamOption) => {
      if (teamOption.getAttribute("value") === "All" || teamOption.getAttribute("value") === "None") {
        return false;
      }
      return teamOption.classList.contains("active");
    })
    .map((teamOption) => {
      return teamOption.getAttribute("value");
    });

    return teamNames;
  }

  createTeamFilterItem() {
    let selectorRoot = document.createElement("div");
    selectorRoot.id = "teamFilter";
    
    let listRoot = document.createElement("ul");
    selectorRoot.appendChild(listRoot);
    listRoot.classList.add("list-group", "team-filter-group");
    
    // There are 3 roughly equally-sized columns of teams in the selector
    let heightCounter = 0;
    let teamList = Object.keys(this.scoreData.totals).concat(["All"]);
    let teamCount = teamList.length;
    let maxHeight = Math.ceil(teamCount/3);
    teamList.forEach((team) => {
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
        this.handleTeamClick(teamOption);
        this.notifySubscribers();
      };

      heightCounter += 1;
      listRoot.appendChild(teamOption);
    })
    
    this.root.appendChild(selectorRoot);
  }
  
  handleTeamClick(teamOption) {
    let filter = this.root.querySelector("#teamFilter");
    if (teamOption.innerHTML === "All") {
      teamOption.innerHTML = "None";
      Array.from(filter.querySelectorAll("li")).forEach((teamNode) => {
        teamNode.classList.add("active");
      })
    }
    else if (teamOption.innerHTML === "None") {
      teamOption.innerHTML = "All";
      Array.from(filter.querySelectorAll("li")).forEach((teamNode) => {
        teamNode.classList.remove("active");
      })
    }
    else if (teamOption.classList.contains("active")) {
      teamOption.classList.remove("active");
    }
    else {
      teamOption.classList.add("active");
    }
  }
}
