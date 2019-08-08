const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function getData() {
  console.log("from the schedule page");
  var weeks = document.getElementsByClassName("matchup--table");
  if (weeks.length === 0) {
    console.log("weeks was empty");
    await sleep(500);
    weeks = document.getElementsByClassName("matchup--table");
  }
  console.log(weeks.length);
  console.log(weeks);
  for (var i=0; i<weeks.length; i++) {
    var week = weeks[i];
    console.log(week);
  }
  
  
  
  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  // chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
  //   console.log(response.farewell);
  // });
  console.log("sending message");
  chrome.runtime.sendMessage({
    action: "hello"
  });
};


getData();

// matchup--table
// 
// Table2__tr Table2__tr--md Table2__odd
// 
// teamName truncate
// 
// result-column