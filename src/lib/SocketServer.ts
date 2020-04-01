import socketio from "socket.io";
import { APlayer } from "./APlayer";
import { ARealtimeGame } from "./ARealtimeGame";
import { IoSocket } from "./IoSocket";
import { ISocket } from "./ISocket";

export class SocketServer<R extends ARealtimeGame<P>, P extends APlayer>
{
	private static readonly MIN_BINDED_PORT = 1024;
	private static readonly MAX_BINDED_PORT = 65535;
	private ioServer?:socketio.Server;
	private readonly gameRooms:R[] = [];
	private readonly bindedPorts = new Map<SocketServer.Type, SocketServer.Port>();

	constructor(private RoomInstanciator:(new () => R), private PlayerInstanciator:(new (s:ISocket) => P))
	{
		
	}

	private instanciatePlayerToRoom(socket:ISocket)
	{
		let room = this.gameRooms[this.gameRooms.length - 1];

		if (room.isFilled()) {
			room = new this.RoomInstanciator();
			this.gameRooms.push(room);
		}
		room.addPlayer(new this.PlayerInstanciator(socket));
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
	}
	
	public bindPort(serverType:SocketServer.Type, port:SocketServer.Port):boolean
	{
		if (port < SocketServer.MIN_BINDED_PORT || port > SocketServer.MAX_BINDED_PORT)
			return (false);
		this.bindedPorts.set(serverType, port);
		return (true);
	}
	public run()
	{
		this.createIoServer();
		this.gameRooms.push(new this.RoomInstanciator());
	}
};

export module SocketServer
{
	export type Port = number;
	export enum Type
	{
		IO = 0b001,
		WEB = 0b010,
		TCP = 0b100
	};
};