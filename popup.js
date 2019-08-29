document.addEventListener('DOMContentLoaded', function(){
 
chrome.storage.local.get(['pointsPerWin'], function(pointsPerWin) {
  var defaultPoints = (pointsPerWin.pointsPerWin !== undefined) ? pointsPerWin.pointsPerWin : 14;
  document.getElementById("winValue").value = defaultPoints;
});

document.getElementById("winValueForm").addEventListener("submit", function(e) {
  e.preventDefault();
  let points = document.getElementById("winValue").value;
  let pointsNum = parseInt(points);
  chrome.storage.local.set({"pointsPerWin": pointsNum}, function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id,{ action: "refreshDisplay" });
    });
  });
});
});
