import socketio from "socket.io";
import { IServer, ServerPort, ServerCallback } from "./IServer";
import { IoSocket } from "./../socket/IoSocket";

export class IoSocketServer implements IServer
{
	private readonly ioServer:socketio.Server;
	readonly PORT:ServerPort;
	
	constructor(port:ServerPort, callback:ServerCallback)
	{
		this.PORT = port;
		this.ioServer = socketio(port);
		this.ioServer.on("connection", (socket:socketio.Socket) => {
			callback(new IoSocket(socket));
		});
		console.log(`Io Socket server is listening on port ${port}.`);
	}
};