class ButtonGroup {
  htmlItem;
  buttons;
  id;
  changeSubscribers = [];

// config: {
//   buttons: [
//     {
//       displayName: String
//       value: String
//       selected: Bool
//     }
//   ]
//   id: String
//   uniqueSelection: Bool
// } 

  constructor(config) {
    this.id = config.id;
    this.createItem(config);
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didUpdateButtonGroup();
    });
  }
  
  getButtonGroupInfo() {
    let buttonInfo = this.buttons.map((button) => {
      return {
        displayName: button.displayName,
        value: button.value,
        selected: button.isSelected()
      }
    })
    
    return {
      buttons: buttonInfo,
      id: this.id,
      uniqueSelection: this.uniqueSelection
    }
  }

  didClickButton(clickedButton) {
    if (this.uniqueSelection && clickedButton.isSelected()) {
      this.buttons.forEach((button) => {
        if (button !== clickedButton) {
          button.deselect();
        }
      })
    }
    this.notifySubscribers();
  }

  createItem(config) {
    let buttonGroup = document.createElement("div");
    buttonGroup.classList.add("btn-group");
    buttonGroup.setAttribute("role", "group");
    
    let createdButtons = [];

    config.buttons.forEach((buttonInfo) => {
      let button = new ButtonItem(buttonInfo.displayName, buttonInfo.value);
      if (buttonInfo.selected) {
        button.select();
      }
      button.addChangeSubscriber(this);
      buttonGroup.appendChild(button.htmlItem);
      createdButtons.push(button);
    })

    this.buttons = createdButtons;
    this.htmlItem = buttonGroup;
  }
}
