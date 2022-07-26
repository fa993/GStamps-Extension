console.log("Doneee");

setTimeout(() => console.log("Doneee"), 1000);

chrome.storage.sync.get("stickers", (items) => {
  console.log(items["stickers"]);
});
