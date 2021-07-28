class ButtonToolbar {
  htmlItem;
  buttonGroups;
  changeSubscribers = [];

  constructor(buttonGroupConfigs) {
    this.createItem(buttonGroupConfigs);
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  didUpdateButtonGroup() {
    this.notifySubscribers();
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateButtonToolbar();
    });
  }
  
  getButtonToolbarInfo() {
    return this.buttonGroups.map((group) => {
      return group.getButtonGroupInfo();
    })
  }
  
  createItem(buttonGroupConfigs) {
    let toolbarRoot = document.createElement("div");
    toolbarRoot.classList.add("btn-toolbar");
    toolbarRoot.setAttribute("role", "toolbar");
    
    let createdGroups = [];
    
    buttonGroupConfigs.forEach((config) => {
      let group = new ButtonGroup(config);
      group.addChangeSubscriber(this);
      toolbarRoot.appendChild(group.htmlItem);
      createdGroups.push(group);
    })

    this.buttonGroups = createdGroups;
    this.htmlItem = toolbarRoot;
  }
}
