import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO");

    const io = new Server(res.socket.server, {
      cors: {
        origin: [
          "http://localhost:3000",

          "https://web-rtc-app-puce.vercel.app/" 
        ],
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);
      socket.emit("me", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        socket.broadcast.emit("callEnded");
      });

      socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", {
          signal: data.signalData,
          from: data.from,
          name: data.name,
        });
      });

      socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", {
          signal: data.signal,
          userName: data.userName,
        });
      });

      socket.on("sendMessage", (message) => {
        io.emit("receiveMessage", message);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
