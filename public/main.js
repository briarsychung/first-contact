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

function inputBar() {
  let consoleInput = document.getElementById("console-input");
  if (cursorToggle) {
    consoleInput.innerHTML = "_";
    cursorToggle = !cursorToggle;
    setTimeout(inputBar, 500);
  } else {
    consoleInput.innerHTML = " ";
    cursorToggle = !cursorToggle;
    setTimeout(inputBar, 500);
  }
}

inputBar(true);

let focused = "window-none";
let windows = document.getElementsByClassName("window");
let z = 1;

for (let i = 0; i < windows.length; i++) {
  windows[i].addEventListener("click", () => {
    let focusedWindow = document.getElementById(focused);
    focusedWindow.classList.remove("focused");
    if (focused !== windows[i].id && windows[i].id !== "window-none") {
      windows[i].style.zIndex = z;
      z++;
    }
    focused = windows[i].id;
    focusedWindow.classList.add("focused");
  });
}
