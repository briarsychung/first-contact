const ALIEN_TIME = 2000;
const LOCK_TIME = 100;

let emoji = [
  [
    "👍",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/like.png?v=1730298927413">',
  ],
  [
    "🛸",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/ufo-flying.png?v=1730298933602">',
  ],
  [
    "🏃",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/run.png?v=1730300057420">',
  ],
  [
    "🌎",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/globe-earth.png?v=1730298935943">',
  ],

  [
    "💨",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/wind.png?v=1730298938203">',
  ],
  [
    "👌",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/ok.png?v=1730299399635">',
  ],
  [
    "📡",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/satellite.png?v=1730299405200">',
  ],

  [
    "✅",
    '<img class="emoji" src="https://cdn.glitch.global/f065c294-3788-4460-8446-da39f910b52f/check-box.png?v=1730299402287">',
  ],
];

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

function loadScene(scene, end) {
  socket.emit("load-send", scene, end);
}

socket.on("load-receive", (scene, end) => {
  if (mode === 1) {
    resetZIndex();

    setTimeout(() => {
      consoleLoad(scene, end);
    }, 150);
    flightTime = FLIGHT_STARTS[scene - 1];
    flightUpdate();
    radioLoad(scene <= 2 ? 0 : 2);

    airdrop(end || scene === 5 ? 2 : 0);
    zoom(0);
  } else if (mode === 2) {
    document.getElementById("scene-display").innerHTML = scene;

    document.getElementById("radio-status").innerHTML =
      scene > 2 ? "Connected (High)" : "Normal (Low)";
  }
});

function consoleLoad(scene, end) {
  consoleReset();
  currentMessage = 0;
  for (let i = 0; i < messages.length; i++) {
    if (
      messages[i].type === (end ? "end" : "start") &&
      messages[i].scene === scene
    ) {
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

  if (scene >= 4) {
    windowFocus("window-console");
  }
}

let consoleContainer = document.getElementById("console-container");

function consoleSendMessage(message) {
  for (let i = 0; i < emoji.length; i++) {
    message = message.replaceAll(emoji[i][0], emoji[i][1]);
  }

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
const VEL = 0.03;
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
  setTimeout(flightStep, 350);
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

const RADIO_MAX_ROWS = 24;
const RADIO_MAX_COLS = 48;
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

  radioTimeout = setTimeout(radioStep, 150);
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

function glitch() {
  socket.emit("glitch-send");
}

let windowGlitch = document.getElementById("window-glitch");
socket.on("glitch-receive", () => {
  if (mode === 1) {
    windowGlitch.style.visibility = "visible";
    setTimeout(() => {
      windowGlitch.style.visibility = "hidden";
    }, 200);
    setTimeout(() => {
      windowGlitch.style.visibility = "visible";
    }, 275);
    setTimeout(() => {
      windowGlitch.style.visibility = "hidden";
    }, 325);
    radioState(3);
  }
});

socket.on("z-receive", () => {
  if (mode === 1) {
    z = 1;
    for (let i = 0; i < windows.length; i++) {
      if (Number(windows[i].style.zIndex) < 990) {
        windows[i].style.zIndex = "";
      }
    }
  }
});

function resetZIndex() {
  socket.emit("z-send");
}

let windowMap = document.getElementById("window-map");
let mapContainer = document.getElementById("map-container");
let mapCrosshair = document.getElementById("map-crosshair");
let mapX = document.getElementById("map-x");
let mapY = document.getElementById("map-y");

function openFile() {
  setTimeout(() => {
    mapContainer.style.transition = "2s";
    mapContainer.style.backgroundSize = "200%";
  }, 200);
  windowMap.style.visibility = "visible";
  windowFocus("window-map");

  setTimeout(() => {
    document.getElementById("map-crosshair").style.visibility = "visible";
    mapX.style.transition = "0.5s";
    mapY.style.transition = "0.5s";
    mapX.style.right = "0";
    mapY.style.bottom = "0";
  }, 2000);
}

function closeFile() {
  mapContainer.style.transition = "0s";
  mapContainer.style.backgroundSize = "100%";
  windowMap.style.visibility = "hidden";
}

function closeZoom() {
  zoomClipper.style.transition = "0s";
  zoomClipper.style.transform = "scale(1)";

  zoomImg.style.transition = "0s";
  zoomImg.style.left = "50%";
  zoomImg.style.top = "50%";

  windowZoom.style.visibility = "hidden";
}

let windowAirdrop = document.getElementById("window-airdrop");

function airdrop(state) {
  socket.emit("airdrop-send", state);
}

socket.on("airdrop-receive", (state) => {
  if (mode === 1) {
    mapX.style.transition = "0s";
    mapY.style.transition = "0s";
    if (state === 1) {
      windowAirdrop.style.visibility = "visible";
      closeFile();
      windowFocus("window-airdrop");

      document.getElementById("map-crosshair").style.visibility = "hidden";
      mapX.style.right = "100%";
      mapY.style.bottom = "100%";
    } else if (state === 0) {
      windowAirdrop.style.visibility = "hidden";
      closeFile();

      document.getElementById("map-crosshair").style.visibility = "hidden";
      mapX.style.right = "100%";
      mapY.style.bottom = "100%";
    } else {
      windowAirdrop.style.visibility = "visible";
      mapContainer.style.transition = "0";
      mapContainer.style.backgroundSize = "200%";
      windowMap.style.visibility = "visible";

      document.getElementById("map-crosshair").style.visibility = "visible";
      mapX.style.right = "0";
      mapY.style.bottom = "0";
    }
  }
});

let windowZoom = document.getElementById("window-zoom");
let zoomContainer = document.getElementById("zoom-container");
let zoomClipper = document.getElementById("zoom-clipper");
let zoomImg = document.getElementById("zoom-img");
let zoomCrosshair = document.getElementById("zoom-crosshair");
let zoomX = document.getElementById("zoom-x");
let zoomY = document.getElementById("zoom-y");
zoomContainer.addEventListener("click", (e) => {
  let rect = zoomContainer.getBoundingClientRect();
  zoomImg.style.transition = "2s";
  zoomImg.style.left =
    100 * (1 - (e.clientX - rect.left) / rect.width / 2 - 0.25) + "%";
  zoomImg.style.top =
    100 * (1 - (e.clientY - rect.top) / rect.height / 2 - 0.25) + "%";
  zoomClipper.style.transform = "scale(2)";
  zoomClipper.style.transition = "2s";
  zoomX.style.top = 100 * ((e.clientY - rect.top) / rect.height) + "%";
  zoomY.style.left = 100 * ((e.clientX - rect.left) / rect.width) + "%";
  setTimeout(() => {
    zoomCrosshair.style.visibility = "visible";
    zoomY.style.transition = "0.5s";
    zoomX.style.transition = "0.5s";
    zoomX.style.right = "0";
    zoomY.style.bottom = "0";
  }, 2000);
});

function zoom(state) {
  socket.emit("zoom-send", state);
}

socket.on("zoom-receive", (state) => {
  if (mode === 1) {
    if (state === 1) {
      windowZoom.style.visibility = "visible";
      windowFocus("window-zoom");

      zoomCrosshair.style.visibility = "hidden";
      zoomY.style.transition = "0s";
      zoomX.style.transition = "0s";
      zoomX.style.right = "100%";
      zoomY.style.bottom = "100%";
    } else if (state === 0) {
      windowZoom.style.visibility = "hidden";
      closeZoom();

      zoomCrosshair.style.visibility = "hidden";
      zoomY.style.transition = "0s";
      zoomX.style.transition = "0s";
      zoomX.style.right = "100%";
      zoomY.style.bottom = "100%";
    }
  }
});

window.display = display;
window.consoleSubmit = consoleSubmit;
window.loadScene = loadScene;
window.consoleState = consoleState;
window.consoleDelete = consoleDelete;
window.radioState = radioState;
window.glitch = glitch;
window.resetZIndex = resetZIndex;
window.openFile = openFile;
window.airdrop = airdrop;
window.zoom = zoom;
window.spam = spam;

consoleContainer.scrollTo(0, consoleContainer.scrollHeight);
