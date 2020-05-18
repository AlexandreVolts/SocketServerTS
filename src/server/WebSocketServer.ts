import http from "http";
import ws from "websocket";
import { IServer, ServerPort, ServerCallback } from "./IServer";
import { WebSocket } from "./../socket/WebSocket";

export class WebSocketServer implements IServer
{
	private readonly wsServer:ws.server;
	readonly PORT:ServerPort;

	constructor(port:ServerPort, callback:ServerCallback)
	{
		let server = http.createServer((req, res) => {req; res;});
		
		this.PORT = port;
		server.listen(port, () => {
			console.log(`Web Socket server is listening on port ${port}.`);
		});
		this.wsServer = new ws.server({
			httpServer: server
		});
		this.wsServer.on("request", (req:ws.request) => {
			let socket = req.accept(undefined, req.origin);

			callback(new WebSocket(socket));
			socket.on("error", (err) => {
				console.error(`An error occured on Web Socket server: ${err}.`);
			});
		});
	}
};