console.log("Doneee");

setTimeout(() => console.log("Doneee"), 1000);

var add_radio_button = document.getElementById('add');
var upload_radio_button = document.getElementById('upload');

var addDiv = document.getElementById('addDiv');
var uploadDiv = document.getElementById('mainDiv');

var addRadio = document.getElementById('add');
var uploadRadio = document.getElementById('upload');

document.getElementById('choiceDiv').addEventListener('change', () => {
  if(addRadio.checked) {
    uploadDiv.classList.add('inactive');
    addDiv.classList.remove('inactive');
  } else {
    addDiv.classList.add('inactive');
    uploadDiv.classList.remove('inactive');
  }
})

var dlist = document.getElementById('groups')
var sub_btn = document.getElementById('submit-button');

var gpName = document.getElementById('groups-input');
var stName = document.getElementById('sticker-name-input');

var fileField = document.getElementById('sticker-file');

const error_panel = document.getElementById('error-panel');

var nameState = false;
var fileState = false;

var stnan = [];
var gpnan = [];
var gpid = [];
var stid = [];

renableButton = function() {
  if(nameState && fileState) {
    sub_btn.removeAttribute('disabled')
  } else {
    sub_btn.setAttribute('disabled', "");
  }
}

function getBase64Image(img) {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/jpeg");
  return dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
}

stName.addEventListener('input', () => {
  nameState = stName.value ? true : false;
  renableButton();
});

fileField.addEventListener('input', () => {
  fileState = fileField.files.length == 1;
  renableButton();
});


stickeriddsds = undefined;

sub_btn.addEventListener('click', () => {
  //first check for correct file dimensions

  console.log("Here now");

  var fileToLoad = fileField.files[0];

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

      if(img.height != 512 || img.width != 512) {
        error_panel.innerHTML = "Image must be 512x512";
        return;
      }

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
          opt.textContent = sticname;
          dlist.append(opt);
        }
      }

      fetch("https://gstamps.herokuapp.com/sticker/create", {
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
        stid.push(stickeriddsds);
        stnan.push(sticname);
        chrome.storage.sync.set({
          "sticker_name" : stnan,
          "sticker_id" : stid,
        }, () => console.log("Stickers updated"));
        console.log(result);
        error_panel.innerHTML = "Sticker Id: " + stickeriddsds + "<br>";
        if(name != "") {
          fetch("https://gstamps.herokuapp.com/sticker/add-to-group?group_id=" + group_id + "&name=" + name, {
            method : 'PATCH',
            body: JSON.stringify({
              sticker_id : stickeriddsds,
            })
          }).then(r => r.text()).then(r => {
            console.log(r);
            error_panel.innerHTML += "Group Id: " + group_id;
          }).catch((error) => console.error('Couldnt add sticker to group:', error));
        }
      }).catch((error) => console.error('Couldnt create sticker:', error));
    };

  }

  gpName.value = "";
  stName.value = "";
  fileField.value = "";
  nameState = false;
  fileState = false;
  renableButton();

});

var group_add_input = document.getElementById("group-add-input");
var group_submit_button = document.getElementById('add-button');
var optionalTitle = document.getElementById('optionalTitle');

group_add_input.addEventListener('change', () => {
  if(group_add_input.value) {
    group_submit_button.removeAttribute('disabled');
  } else {
    group_submit_button.setAttribute('disabled', '');
  }
});

group_submit_button.addEventListener('click', () => {
  const rr = group_add_input.value;
  fetch("https://gstamps.herokuapp.com/sticker/get-group?group_id=" + rr, {

    method: 'GET',
  }).then(r => r.text()).then(r => JSON.parse(r)).then(r => {
    sticksss = r.data;
    for(var i = 0; i < sticksss.length; i++) {
      stnan.push(sticksss[i].name);
      stid.push(sticksss[i]._id);
    }
    gpid.push(rr);
    gpnan.push(optionalTitle.value);
    chrome.storage.sync.set({
      "group_name" : gpnan,
      "group_id" : gpid,
      "sticker_name" : stnan,
      "sticker_id" : stid,
    }, () => console.log("All data updated"));

  }).catch((error) => console.error('Couldnt get sticker group:', error));

});

chrome.storage.sync.get(["group_name", "group_id", "sticker_id", "sticker_name"], (items) => {
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

  console.log(items);
  for(var i = 0; i < gpnan.length; i++) {
    opt = document.createElement("option");
    opt.textContent = gpnan[i];
    dlist.append(opt);
  }
});

console.log(uuidv4());
