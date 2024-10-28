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

io.sockets.on("connection", (socket) => {
  socket.on("message-send", (message) => {
    io.emit("message-receive", message);
  });
  socket.on("load-send", (message) => {
    io.emit("load-receive", message);
  });
  socket.on("play-send", (state) => {
    io.emit("play-receive", state);
  });
  socket.on("remove-send", (state) => {
    io.emit("remove-receive", state);
  });
  socket.on("wow-send", (state) => {
    io.emit("wow-receive", state);
  });
  socket.on("glitch-send", (state) => {
    io.emit("glitch-receive", state);
  });
});
