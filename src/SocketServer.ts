import net from "net";
import socketio from "socket.io";
import { APlayer } from "./APlayer";
import { ARealtimeGame } from "./ARealtimeGame";
import { ISocket } from "./socket/ISocket";
import { IoSocket } from "./socket/IoSocket";
import { TcpSocket } from "./socket/TcpSocket";

export class SocketServer<R extends ARealtimeGame<P>, P extends APlayer>
{
	private static readonly MIN_BINDED_PORT = 1024;
	private static readonly MAX_BINDED_PORT = 65535;
	private readonly gameRooms:R[] = [];
	private readonly bindedPorts = new Map<SocketServer.Type, SocketServer.Port>();
	private ioServer?:socketio.Server;
	private tcpServer?:net.Server;

	constructor(private readonly RoomInstanciator:(new () => R), 
		private readonly PlayerInstanciator:(new (s:ISocket) => P))
	{
		
	}

	/**
	 * Instanciate a Player object and bind it to an ISocket.
	 * It also add the player to the room, and instanciate a new one if all are filled.
	 */
	private instanciatePlayerToRoom(socket:ISocket)
	{
		let room:R;
		let player:P;

		if (this.gameRooms.length == 0)
			this.gameRooms.push(new this.RoomInstanciator());
		room = this.gameRooms[this.gameRooms.length - 1];
		if (room.isFilled()) {
			room = new this.RoomInstanciator();
			this.gameRooms.push(room);
		}
		player = new this.PlayerInstanciator(socket);
		room.addPlayer(player);
		console.log(this.gameRooms);
	}
	private createIoServer()
	{
		const PORT = this.bindedPorts.get(SocketServer.Type.IO);
		
		if (!PORT)
			return;
		this.ioServer = socketio(PORT);
		this.ioServer.on("connection", (socket:socketio.Socket) => {
			this.instanciatePlayerToRoom(new IoSocket(socket));
		});
		console.log(`Io Socket server is listening on port ${PORT}.`);
	}
	private createWsServer()
	{
		const PORT = this.bindedPorts.get(SocketServer.Type.TCP);

		if (!PORT)
			return;
	}
	private createTcpServer()
	{
		const PORT = this.bindedPorts.get(SocketServer.Type.TCP);

		if (!PORT)
			return;
		this.tcpServer = new net.Server();
		this.tcpServer.listen(PORT, () => {
			console.log(`TCP Socket server is listening on port ${PORT}.`);
		});
		this.tcpServer.on("connection", (socket:net.Socket) => {
			this.instanciatePlayerToRoom(new TcpSocket(socket));
			socket.on("error", (err) => {
				console.error(`An error occured on TCP socket: ${err}`);
			});
		});
	}

	public bindPort(serverType:SocketServer.Type, port:SocketServer.Port)
	{
		if (port < SocketServer.MIN_BINDED_PORT || port > SocketServer.MAX_BINDED_PORT)
			return;
		this.bindedPorts.set(serverType, port);
	}
	
	/**
	 * Creates the servers whose a port has been binded to, and set them ready to listen to sockets on this port.
	 */
	public run()
	{
		this.createIoServer();
		this.createWsServer();
		this.createTcpServer();
	}
};

export module SocketServer
{
	export type Port = number;
	export enum Type
	{
		IO = 0b001,
		WS = 0b010,
		TCP = 0b100
	};
};