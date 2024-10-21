const socket = io.connect();
let mode = 0;

function display(screen) {
  if (screen === 1) {
    document.getElementById("screen-main").style.visibility = "visible";
  } else if (screen === 2) {
    document.getElementById("screen-control").style.visibility = "visible";
  }
  document.getElementById("screen-load").style.visibility = "hidden";
  mode = screen;
}

function submit() {
  socket.emit("message-send", document.getElementById("input-message").value);
}

socket.on("message-receive", (message) => {
  if (mode === 1) {
    alert(message);
  }
});

window.display = display;
window.submit = submit;

let cursorToggle = true;
let messageValue = "";
let consoleInput = document.getElementById("console-input");

function consoleInputBar() {
  if (focused === "window-console") {
    if (cursorToggle) {
      consoleInput.innerHTML = messageValue + "_";
      cursorToggle = !cursorToggle;
    } else {
      consoleInput.innerHTML = messageValue + " ";
      cursorToggle = !cursorToggle;
    }
    setTimeout(consoleInputBar, 500);
  }
}

let focused = "window-none";
let windows = document.getElementsByClassName("window");
let z = 1;

for (let i = 0; i < windows.length; i++) {
  windows[i].addEventListener("click", () => {
    if (focused !== windows[i].id) {
      document.getElementById(focused).classList.remove("focused");
      if (windows[i].id !== "window-none") {
        windows[i].style.zIndex = z;
        z++;
      }

      focused = windows[i].id;

      if (windows[i].id === "window-console") {
        consoleInputBar(true);
      } else {
        cursorToggle = true;
        consoleInput.innerHTML = messageValue + " ";
      }
      focused = windows[i].id;
      document.getElementById(focused).classList.add("focused");
    }
  });
}

document.addEventListener("keypress", (e)=> {
  console.log(e);
})