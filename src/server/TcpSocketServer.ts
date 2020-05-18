import net from "net";
import { IServer, ServerPort, ServerCallback } from "./IServer";
import { TcpSocket } from "./../socket/TcpSocket";

export class TcpSocketServer implements IServer
{
	private readonly tcpServer:net.Server;
	readonly PORT:ServerPort;

	constructor(port:ServerPort, callback:ServerCallback)
	{
		this.PORT = port;
		this.tcpServer = new net.Server();
		this.tcpServer.listen(port, () => {
			console.log(`TCP Socket server is listening on port ${port}.`);
		});
		this.tcpServer.on("connection", (socket:net.Socket) => {
			callback(new TcpSocket(socket));
			socket.on("error", (err) => {
				console.error(`An error occured on TCP socket server: ${err}.`);
			});
		});
	}
};