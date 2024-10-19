const express = require("express");

const app = express();
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const http = require("http");
const server = http.createServer(app);
server.listen(process.env.PORT);

const io = require("socket.io")(server);

let data = {
  state: "wait",
  players: [],
  time: {},
  messages: 0,
  display: "",
  ending: {},
};


function checkNext() {
  io.emit("update", data);
}

io.sockets.on("connection", (socket) => {
  socket.on("join", (user) => {
    switch (data.state) {
      case "wait":
        user.color = newColor(data.players);
        data.players.push(user);
        break;
    }
    io.emit("update", data);
  });

  socket.on("start", (id) => {
    data.players[data.players.findIndex((a) => a.id === id)].start = true;
    checkNext();
  });

  socket.on("send", (message) => {
    data.messages++;
    socket.broadcast.emit("receive", message);
  });

  socket.on("attack", (attack) => {
    data.players[
      data.players.findIndex((a) => a.id === attack.id)
    ].attacking = true;
    data.display = attack.display;
    io.emit("update", data);
  });

  socket.on("check", () => {
    if (data.state === "end") return;

    data.state = "end";
    data.ending = {
      number: data.players.filter((a) => a.attacking).length,
      total: data.players.length,
      time: Date.now() - data.time.millis,
    };
    io.emit("update", data);
  });

  socket.on("finish", (id) => {
    data.players[data.players.findIndex((a) => a.id === id)].finish = true;
    checkNext();
  });

  socket.on("disconnect", () => {
    data.players = data.players.filter((a) => a.id !== socket.id);
    data.state =
      data.state === "game" && data.players.length < 2 ? "wait" : data.state;
    data.state =
      data.state === "end" && data.players.length === 0 ? "wait" : data.state;
    io.emit("update", data);
  });
});
