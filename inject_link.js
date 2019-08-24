if (!window.sleep) {
  window.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}


async function inject_link() {
  console.log("here in inject link onload");
  var standingsButton = document.querySelector(".standings.NavSecondary__Item");
  console.log(standingsButton);
  while (!standingsButton) {
    console.log("standings not yet here");
    await window.sleep(500);
    standingsButton = document.querySelector(".standings.NavSecondary__Item");
  }
  console.log(standingsButton);
  standingsButton.addEventListener("click", function() {
    chrome.runtime.sendMessage({
      action: "loadScores"
    });
  });
  
}

inject_link();
