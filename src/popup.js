console.log("Doneee");

setTimeout(() => console.log("Doneee"), 1000);

const pg1= document.getElementById('page1');
const pg2 = document.getElementById("page2");

const infoDiv = document.getElementById('info-panel');

var dlist = document.getElementById('groups')
var sub_btn = document.getElementById('submit-button');

var gpName = document.getElementById('groups-input');
var stName = document.getElementById('sticker-name-input');

var fileField = document.getElementById('sticker-file');

const error_panel = document.getElementById('error-panel');

const dropArea = document.getElementById('drop-zone');

const previewArea = document.getElementById('preview');
previewArea.style.visibility = "hidden";

var nameState = false;
var fileState = false;

var stnan = [];
var gpnan = [];
var gpid = [];
var stid = [];
var sttogp = [];

var selectedFile = undefined;

var animationHandler = undefined;
var animationTick = 0;

actualLoader = function() {
  rer = "Loading";
  for(var rrt = 0; rrt <= animationTick; rrt++) {
    rer += ".";
  }
  infoDiv.textContent = rer;
  animationTick++;
  animationTick = animationTick % 3;

}

setupLoading = function() {
  animationHandler = setInterval(actualLoader, 500);
}

cancelLoading = function() {
  clearInterval(animationHandler);
}

setupDone = function() {
  infoDiv.textContent = "Done";
}

setupFailed = function() {
  infoDiv.textContent = "Failed";
}

renableButton = function() {
  if(nameState && fileState) {
    sub_btn.removeAttribute('disabled')
    sub_btn.classList.remove('disabled-state')
  } else {
    sub_btn.setAttribute('disabled', "");
    sub_btn.classList.add('disabled-state')
  }
}

setupPreview = function() {
  var reader = new FileReader();

  reader.onload = function(event) {
    previewArea.src = event.target.result;
    previewArea.style.visibility = "visible";
  };

  reader.readAsDataURL(selectedFile);
}

switchContext = function() {
  // if(pg1.classList.contains("inactive")) {
  //   pg1.classList.remove('inactive');
  //   pg2.classList.add('inactive');
  // } else {
  //   pg2.classList.remove('inactive');
  //   pg1.classList.add('inactive');
  //   setupPreview();
  // }
}

// dropArea.addEventListener('dragover', (ev) => {
//   // Prevent default behavior (Prevent file from being opened)
//   ev.preventDefault();
// });
//
// dropArea.addEventListener('drop', (ev) => {
//   console.log('File(s) dropped');
//   fileState = ev.dataTransfer.files.length == 1;
//   if(fileState) {
//     selectedFile = ev.dataTransfer.files[0];
//     switchContext();
//   }
//   renableButton();
//   // Prevent default behavior (Prevent file from being opened)
//   ev.preventDefault();
// });

function getBase64Image(img) {
  var canvas = document.createElement("canvas");

  var scaledDim2 = Math.max(img.width, img.height);
  var ratio = scaledDim2 / 512;

  canvas.width = img.width / ratio;
  canvas.height = img.height / ratio;

  console.log(canvas.width);
  console.log(canvas.height);

  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  var dataURL = canvas.toDataURL("image/jpeg");
  return dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
}

stName.addEventListener('input', () => {
  nameState = stName.value ? true : false;
  renableButton();
});

fileField.addEventListener('input', () => {
  fileState = fileField.files.length == 1;
  if(fileState) {
    selectedFile = fileField.files[0];
    switchContext();
    setupPreview();
  }
  renableButton();
});


stickeriddsds = undefined;

sub_btn.addEventListener('click', () => {
  //first check for correct file dimensions

  console.log("Here now");
  setupLoading();

  var fileToLoad = selectedFile;

  var fileReader = new FileReader();

  var img = undefined;

  const sticname = stName.value;
  const name =   gpName.value;

  fileReader.readAsDataURL(fileToLoad);
  fileReader.onload = function(fileLoadedEvent) {
    var srcData = fileLoadedEvent.target.result; // <--- data: base64

    // var newImage = document.createElement('img');
    // newImage.src = srcData;

    img = new Image();

    img.src = srcData;

    img.onload = function () {
      console.log(img.height);
      console.log(img.width);

      // if(img.height != 512 || img.width != 512) {
      //   error_panel.innerHTML = "Image must be 512x512";
      //   cancelLoading();
      //   infoDiv.textContent = "Image must be 512x512";
      //   return;
      // }

      const b64Img = getBase64Image(img);

      // const b64Img = encodeURIComponent(newImage.getAttribute('src').slice('data:image/jpeg;base64,'.length));

      console.log("Converted Base64 version is " + b64Img);

      //then fire API request to create sticker after encoding it with base 64 url and patch it in the group
      var group_id = undefined;

      if(name != "") {

        for(var i = 0; i < gpnan.length; i++) {
          if(name == gpnan[i]) {
            group_id = gpid[i];
            break;
          }
        }

        if(group_id == undefined) {
          //add group to localStorage and to datalist

          group_id = uuidv4();
          gpid.push(group_id);
          gpnan.push(name);
          chrome.storage.sync.set({
            "group_name" : gpnan,
            "group_id" : gpid,
          }, () => console.log("Group updated"));

          opt = document.createElement("option");
          opt.textContent = name;
          dlist.append(opt);
        }
      }

      fetch("https://gstamps.onrender.com/sticker/create", {
        method : 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name : sticname,
          data : b64Img,
        })
      })
      .then(r => r.text()).then(result => {
        tty = JSON.parse(result);
        stickeriddsds = tty["data"]["object_id"]
        console.log(result);
        error_panel.innerHTML = "Sticker Id: " + stickeriddsds + "<br>";
        if(name != "") {
          fetch("https://gstamps.onrender.com/sticker/add-to-group?group_id=" + group_id + "&name=" + name, {
            method : 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sticker_id : stickeriddsds,
            })
          }).then(r => r.text()).then(r => {
            console.log(r);
            error_panel.innerHTML += "Group Id: " + group_id;
          }).catch((error) => {
            console.error('Couldnt add sticker to group:', error)
          })
          .finally(() => {
            stid.unshift(stickeriddsds);
            stnan.unshift(sticname);
            sttogp.unshift(group_id);
            chrome.storage.sync.set({
              "sticker_name" : stnan,
              "sticker_id" : stid,
              "sticker_to_groups" : sttogp,
            }, () => console.log("Stickers updated"));
            cancelLoading();
            setupDone();
            switchContext();
            previewArea.style.visibility = "hidden";
          });
        } else {
          stid.unshift(stickeriddsds);
          stnan.unshift(sticname);
          sttogp.unshift(-1);
          chrome.storage.sync.set({
            "sticker_name" : stnan,
            "sticker_id" : stid,
            "sticker_to_groups" : sttogp,
          }, () => console.log("Stickers updated"));
          cancelLoading();
          setupDone();
          switchContext();
          previewArea.style.visibility = "hidden";
        }

      }).catch((error) => {
        console.error('Couldnt create sticker:', error)
        cancelLoading();
        setupFailed();
      });
    };

  }

  gpName.value = "";
  stName.value = "";
  fileField.value = "";
  nameState = false;
  fileState = false;
  renableButton();

});

chrome.storage.sync.get(["group_name", "group_id", "sticker_id", "sticker_name", "sticker_to_groups"], (items) => {

  stnan = [];
  gpnan = [];
  gpid = [];
  stid = [];
  sttogp = [];

  if(items.sticker_name != undefined) {
    stnan.push(...items.sticker_name);
  }

  if(items.group_name != undefined) {
    gpnan.push(...items.group_name);
  }

  if(items.group_id != undefined) {
    gpid.push(...items.group_id);
  }

  if(items.sticker_id != undefined) {
    stid.push(...items.sticker_id);
  }

  if(items.sticker_to_groups != undefined) {
    sttogp.push(...items.sticker_to_groups);
  }

  console.log(items);
  for(var i = 0; i < gpnan.length; i++) {
    opt = document.createElement("option");
    opt.textContent = gpnan[i];
    dlist.append(opt);
  }
});

console.log(uuidv4());

// chrome.storage.sync.clear();
