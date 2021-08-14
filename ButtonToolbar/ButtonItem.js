class ButtonItem {
  htmlItem;
  displayName;
  value;
  changeSubscribers = [];
  
  constructor(displayName, value) {
    this.displayName = displayName;
    this.value = value;
    this.createItem();
  }
  
  addChangeSubscriber(subscriber) {
    this.changeSubscribers.push(subscriber);
  }

  notifySubscribers() {
    this.changeSubscribers.forEach((subscriber) => {
      subscriber.didClickButton(this);
    });
  }
  
  isSelected() {
    return this.htmlItem.classList.contains("active");
  }
  
  select() {
    if (!this.isSelected()) {
      this.htmlItem.classList.add("active");
    }
  }
  
  deselect() {
    if (this.isSelected()) {
      this.htmlItem.classList.remove("active");
    }
  }
  
  createItem() {
    let button = document.createElement("button");
    button.innerHTML = this.displayName;
    button.setAttribute("value", this.value);
    button.setAttribute("type", "button");
    button.setAttribute("data-toggle", "button");
    button.classList.add("btn", "btn-secondary", "shadow-none");

    button.onclick = () => {
      if (this.isSelected()) {
        this.deselect();
      }
      else {
        this.select();
      }
      
      this.notifySubscribers();
    };

    this.htmlItem = button;
  }
}
