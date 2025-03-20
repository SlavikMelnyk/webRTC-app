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
      "http://localhost:5001",
      "https://web-rtc-app-puce.vercel.app",
      "https://webrtc-app-04ea.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = {}; // { roomID: [{ id: socketId, userName: string }] }
const socketToRoom = {}; // { socketId: roomID }

// Add this function to help debug room state
const logRoomState = (roomID) => {
  console.log(`Room ${roomID} state:`, {
    users: users[roomID] || [],
    totalUsers: users[roomID]?.length || 0
  });
};

io.on("connection", (socket) => {
	console.log("New client connected:", socket.id);
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		console.log("Client disconnected:", socket.id);
		const roomID = socketToRoom[socket.id];
		if (roomID) {
			users[roomID] = users[roomID]?.filter(user => user.id !== socket.id);
			socket.to(roomID).emit("user left", socket.id);
			delete socketToRoom[socket.id];
			logRoomState(roomID);
		}
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
	socket.on("join room", ({ roomID, userName }) => {
        console.log(`User ${socket.id} (${userName}) joining room: ${roomID}`);
        
        socket.join(roomID);
        
        if (!users[roomID]) {
            users[roomID] = [];
        }
        
        if (users[roomID].length >= 4) {
            socket.emit("room full");
            return;
        }

        users[roomID].push({ id: socket.id, userName });
        socketToRoom[socket.id] = roomID;
        
        const usersInThisRoom = users[roomID].filter(user => user.id !== socket.id);
        
        // Log room state for debugging
        logRoomState(roomID);
        
        socket.emit("all users", usersInThisRoom);
        socket.to(roomID).emit("user joined", { 
            signal: socket.id, 
            callerID: socket.id,
            userName 
        });
    });

    socket.on("sending signal", payload => {
        socket.to(payload.userToSignal).emit("user joined", {
            signal: payload.signal,
            callerID: payload.callerID,
            userName: payload.userName
        });
    });

    socket.on("returning signal", payload => {
        socket.to(payload.callerID).emit("receiving returned signal", {
            signal: payload.signal,
            id: socket.id
        });
    });

})

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));