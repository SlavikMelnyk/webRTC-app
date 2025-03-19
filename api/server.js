const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://web-rtc-app-puce.vercel.app",
      "https://webrtc-app-04ea.onrender.com"
    ],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
	console.log("New client connected:", socket.id);
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		console.log("Client disconnected:", socket.id);
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", { signal: data.signal, userName: data.userName })
	})

	socket.on("sendMessage", (message) => {
		io.emit("receiveMessage", message);
	});
})

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));