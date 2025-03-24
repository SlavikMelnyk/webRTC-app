const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);

const getLocalIP = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
};

const LOCAL_IP = getLocalIP();

const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://web-rtc-app-puce.vercel.app",
      "https://webrtc-app-04ea.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = {};
const socketToRoom = {}; 
const roomMessages = {}; 

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
		const roomID = socketToRoom[socket.id];
		
		if (roomID) {
			if (!roomMessages[roomID]) {
				roomMessages[roomID] = [];
			}
			roomMessages[roomID].push(message);
			
			io.to(roomID).emit("receiveMessage", message);
		} else {
			io.to(message.to).emit("receiveMessage", message);
			io.to(socket.id).emit("receiveMessage", message);
		}
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
        if (roomMessages[roomID]) {
			socket.emit("all users", usersInThisRoom);
			socket.to(roomID).emit("chatHistory", roomMessages[roomID]);
        }
        
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://${LOCAL_IP}:${PORT}`);
});