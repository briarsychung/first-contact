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
    sendMessage("> " + message);
    sendMessage(" ");

    focus("window-console");
  }
});

window.display = display;
window.submit = submit;

let cursorToggle = true;
let messageValue = "";
let consoleInput = document.getElementById("console-input");
let consoleTimeout;

function consoleInputBar() {
  if (focused === "window-console") {
    if (cursorToggle) {
      consoleInput.innerHTML = messageValue + "_";
      cursorToggle = !cursorToggle;
    } else {
      consoleInput.innerHTML = messageValue + " ";
      cursorToggle = !cursorToggle;
    }
    consoleTimeout = setTimeout(consoleInputBar, 500);
  }
}

let focused = "window-none";
let windows = document.getElementsByClassName("window");
let z = 1;

for (let i = 0; i < windows.length; i++) {
  windows[i].addEventListener("click", () => {
    if (focused !== windows[i].id) {
      focus(windows[i].id);
    }
  });
}

function focus(windowId) {
  document.getElementById(focused).classList.remove("focused");

  if (windowId !== "window-none") {
    document.getElementById(windowId).style.zIndex = z;
    z++;
  }

  focused = windowId;

  if (windowId === "window-console") {
    clearTimeout(consoleTimeout);
    consoleInputBar(true);
  } else {
    cursorToggle = true;
    consoleInput.innerHTML = messageValue + " ";
  }
  focused = windowId;
  document.getElementById(focused).classList.add("focused");
}

document.addEventListener("keydown", (e) => {
  if (focused === "window-console") {
    if (e.key.length === 1) {
      messageValue += e.key;
    } else if (e.key === "Backspace") {
      messageValue = messageValue.slice(0, -1);
    }
    consoleInput.innerHTML = messageValue + (cursorToggle ? " " : "_");
  }
});

let consoleContainer = document.getElementById("console-container");

function sendMessage(message) {
  let span = document.createElement("span");
  span.innerHTML = message;
  span.classList.add("console-message");

  consoleContainer.insertBefore(span, consoleInput);
  consoleContainer.scrollTo(0, consoleContainer.scrollHeight);
}
