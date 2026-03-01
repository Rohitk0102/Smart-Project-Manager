const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("join_project", (projectId) => {
            socket.join(projectId);
            console.log(`User joined project: ${projectId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
