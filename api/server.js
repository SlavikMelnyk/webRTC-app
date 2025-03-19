const express = require("express")
const https = require("https")
const fs = require("fs")
const path = require("path")
const app = express()

const options = {
	key: fs.readFileSync('cert.key'),
	cert: fs.readFileSync('cert.crt')
}

const server = https.createServer(options, app)

app.use(express.static(path.join(__dirname, 'frontend/build')));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/frontend/build/index.html'));
});

const io = require("socket.io")(server, {
	cors: {
		origin: [
					"http://localhost:3000", 
					"https://192.168.0.112:5001",
					"https://web-rtc-app-puce.vercel.app/"
				],
		methods: [ "GET", "POST" ]
	}
})

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

server.listen(5001, () => console.log("server is running on port 5001"))