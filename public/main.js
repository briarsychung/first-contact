const ALIEN_TIME = 2000;
const LOCK_TIME = 100;

let consolePlaying = false;

const socket = io.connect();
let mode = 0;
let messages = [];
let currentMessage = 0;
let sceneStarts = [];

fetch("transcript.txt")
  .then((res) => res.text())
  .then((text) => {
    messages = text.split("\n");
    for (let i = 0; i < messages.length; i++) {
      let code = messages[i].split("_");
      if (code[0] === "START") {
        messages[i] = {
          type: "start",
          scene: Number(code[1]),
        };
      } else if (code[0] === "END") {
        messages[i] = {
          type: "end",
          scene: Number(code[1]),
        };
      } else {
        messages[i] = {
          type: "message",
          author: Number(code[0]),
          content: code[1],
        };
      }
    }
  })
  .catch((e) => console.error(e));

function display(screen) {
  if (screen === 1) {
    document.getElementById("screen-main").style.visibility = "visible";
  } else if (screen === 2) {
    document.getElementById("screen-control").style.visibility = "visible";
  }
  document.getElementById("screen-load").style.visibility = "hidden";
  mode = screen;
}

function consoleSubmit(message) {
  socket.emit(
    "message-send",
    message ? message : "> " + document.getElementById("input-message").value
  );
}

socket.on("message-receive", (message) => {
  if (mode === 1) {
    if (message === "reset") {
      consoleReset();
    } else {
      consoleSendMessage(message);
      consoleSendMessage(" ");

      windowFocus("window-console");
    }
  }
});

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
      windowFocus(windows[i].id);
    }
  });
}

function windowFocus(windowId) {
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

let lock = false;

document.addEventListener("keydown", (e) => {
  if (focused === "window-console") {
    /**
    if (e.key.length === 1) {
      messageValue += e.key;
    } else if (e.key === "Backspace") {
      messageValue = messageValue.slice(0, -1);
    } else if (e.key === "Enter") {
      if (messageValue === "reset") {
        consoleReset();
      } else {
        consoleSendMessage("&lt; " + messageValue);
        consoleSendMessage(" ");
      }
      messageValue = "";
    }
    consoleInput.innerHTML = messageValue + (cursorToggle ? " " : "_");*/
    if (
      consolePlaying &&
      currentMessage > -1 &&
      messages[currentMessage].author === 1
    ) {
      let next = messages[currentMessage].content[messageValue.length];
      if (e.key === "Backspace") {
        messageValue = messageValue.slice(0, -1);
      } else if (next) {
        messageValue += next;
      } else if (e.key === "Enter") {
        consoleSendMessage("&lt; " + messageValue);
        consoleSendMessage(" ");

        currentMessage++;
        messageValue = "";

        lock = true;
        setTimeout(() => {
          lock = false;
        }, LOCK_TIME);

        if (messages[currentMessage].author === 0) {
          setTimeout(queueMessage, ALIEN_TIME);
        }
      }
      consoleInput.innerHTML = messageValue + (cursorToggle ? " " : "_");
    }
  }
});

function queueMessage() {
  consoleSendMessage("&gt; " + messages[currentMessage].content);
  consoleSendMessage(" ");

  currentMessage++;

  if (consolePlaying && messages[currentMessage].author === 0) {
    setTimeout(queueMessage, ALIEN_TIME);
  }

  windowFocus("window-console");
}

function loadScene(scene) {
  socket.emit("load-send", scene);
}

socket.on("load-receive", (scene) => {
  if (mode === 1) {
    consoleLoad(scene);
    flightTime = FLIGHT_STARTS[scene - 1];
    flightUpdate();
    radioLoad(scene <= 2 ? 0 : 2);
  } else if (mode === 2) {
    document.getElementById("scene-display").innerHTML = scene;
    
    document.getElementById("radio-status").innerHTML = scene > 2
      ? "Connected (High)"
      : "Normal (Low)";
  }
});

function consoleLoad(scene) {
  consoleReset();
  currentMessage = 0;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].type === "start" && messages[i].scene === scene) {
      break;
    }
    if (messages[i].type === "message") {
      consoleSendMessage(
        (messages[i].author === 0 ? "&gt; " : "&lt; ") + messages[i].content
      );
      consoleSendMessage(" ");
    }

    currentMessage++;
  }
}

let consoleContainer = document.getElementById("console-container");

function consoleSendMessage(message) {
  let span = document.createElement("span");
  span.innerHTML = message;
  span.classList.add("console-message");
  span.classList.add("console-removable");

  consoleContainer.insertBefore(span, consoleInput);
  consoleContainer.scrollTo(0, consoleContainer.scrollHeight);
}

function consoleReset() {
  socket.emit("play-send", false);

  let removables = document.getElementsByClassName("console-removable");
  for (let i = removables.length - 1; i > -1; i--) {
    removables[i].remove();
  }
}

socket.on("play-receive", (state) => {
  if (mode === 1) {
    if (state && !consolePlaying) {
      currentMessage++;
      if (messages[currentMessage].author === 0) {
        queueMessage();
      }
    } else if (!state && consolePlaying) {
      currentMessage--;
    }

    consolePlaying = state;
  } else if (mode === 2) {
    document.getElementById("console-status").innerHTML = state
      ? "Playing"
      : "Paused";
  }
});

function consoleState(state) {
  socket.emit("play-send", state);
}

function consoleDelete() {
  socket.emit("remove-send");
}

socket.on("remove-receive", () => {
  if (mode === 1 && messages[currentMessage - 1].type === "message") {
    currentMessage--;
    let removables = document.getElementsByClassName("console-removable");
    removables[removables.length - 1].remove();
    removables[removables.length - 1].remove();

    consoleState(false);
  }
});

let flights = [];
const VEL = 0.01;
const SPACE = 0.1;
const FLIGHT_STARTS = [10, 35, 0, 50, 65];
let flightTime = 10;

fetch("flights.txt")
  .then((res) => res.text())
  .then((text) => {
    flights = text.split("\n");
    for (let i = 0; i < flights.length; i++) {
      let code = flights[i].split("_");
      flights[i] = {
        id: code[0],
        angle: Number(code[1]) + 0.5,
        pos: {
          x: Number(code[2]) / 1000,
          y: Number(code[3]) / 1000,
        },
      };
    }

    flightLoad();
  })
  .catch((e) => console.error(e));

function getPosition(start, angle, distance) {
  return {
    x: start.x + distance * Math.cos((Math.PI * angle) / 180),
    y: start.y + distance * Math.sin((Math.PI * angle) / 180),
  };
}

function flightLoad() {
  for (let i = 0; i < flights.length; i++) {
    console.log(flights[i]);
    let span = document.createElement("span");
    span.id = flights[i].id;
    span.innerHTML = flights[i].id;
    span.classList.add("flight-label");
    let colors = ["#ff0", "#0f0", "#0ff"];
    span.style.color = colors[i % 3];
    document.getElementById("flight-container").appendChild(span);
  }

  flightStep();
}

function flightStep() {
  flightTime += VEL;
  flightUpdate();
  setTimeout(flightStep, 1000);
}

function flightUpdate() {
  for (let i = 0; i < flights.length; i++) {
    let flight = document.getElementById(flights[i].id);

    let position = getPosition(
      flights[i].pos,
      flights[i].angle,
      SPACE * (flightTime - i)
    );

    if (
      position.x >= 0 &&
      position.x <= 1 &&
      position.y >= 0 &&
      position.y <= 1
    ) {
      flight.style.display = "initial";
      flight.style.left = position.x * 100 + "%";
      flight.style.top = position.y * 100 + "%";
    } else {
      flight.style.display = "none";
    }
  }
}

const RADIO_MAX_ROWS = 18;
const RADIO_MAX_COLS = 32;
let radioCount = RADIO_MAX_ROWS;
let radioContainer = document.getElementById("radio-container");
let wow = false;
let radioTimeout;

function radioLoad(preset) {
  clearTimeout(radioTimeout);
  let columns = document.getElementsByClassName("radio-column");
  for (let i = columns.length - 1; i > -1; i--) {
    columns[i].remove();
  }
  wow = preset === 2;
  radioCount = RADIO_MAX_ROWS;

  for (let i = 0; i < RADIO_MAX_COLS; i++) {
    let column = document.createElement("div");
    column.classList.add("radio-column");
    for (let j = 0; j < RADIO_MAX_ROWS; j++) {
      if (
        j === Math.floor(RADIO_MAX_ROWS / 2) &&
        i === Math.floor(RADIO_MAX_COLS / 2) &&
        preset === 1
      ) {
        wow = true;
      }
      let span = document.createElement("span");
      span.innerHTML = radioGenerate(wow);
      if (span.innerHTML === "0") {
        span.classList.add("radio-zero");
      }
      span.classList.add("radio-output");
      column.appendChild(span);
    }
    radioContainer.insertBefore(column, radioContainer.firstChild);
  }

  radioStep();
}

function radioGenerate(big) {
  let alphanum = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphanum[
    big
      ? Math.floor(Math.random() * 36)
      : Math.floor(7 * Math.pow(Math.random(), 11))
  ];
}

radioLoad(0);

function radioStep() {
  if (radioCount === RADIO_MAX_ROWS) {
    let columns = document.getElementsByClassName("radio-column");
    columns[columns.length - 1].remove();

    let column = document.createElement("div");
    column.classList.add("radio-column");

    for (let j = 0; j < RADIO_MAX_ROWS; j++) {
      let span = document.createElement("span");
      span.innerHTML = " ";
      span.classList.add("radio-output");
      column.appendChild(span);
    }

    radioContainer.insertBefore(column, radioContainer.firstChild);

    radioCount = 0;
  }

  let output = radioContainer.firstChild.children[radioCount];
  output.innerHTML = radioGenerate(wow);
  if (output.innerHTML === "0") {
    output.classList.add("radio-zero");
  }

  radioCount++;

  radioTimeout = setTimeout(radioStep, 500);
}

socket.on("wow-receive", (state) => {
  wow = state === 0 ? false : true;
  if (mode === 1) {
    if (state !== 3) {
      radioLoad(state);
    }
  } else if (mode === 2) {
    document.getElementById("radio-status").innerHTML = state
      ? "Connected (High)"
      : "Normal (Low)";
  }
});

function radioState(state) {
  socket.emit("wow-send", state);
}

window.display = display;
window.consoleSubmit = consoleSubmit;
window.loadScene = loadScene;
window.consoleState = consoleState;
window.consoleDelete = consoleDelete;
window.radioState = radioState;
