import { APlayer } from "./APlayer";
import { ARealtimeGame } from "./ARealtimeGame";
import { IServer, ServerPort } from "./server/IServer";
import { IoSocketServer } from "./server/IoSocketServer";
import { TcpSocketServer } from "./server/TcpSocketServer";
import { ISocket } from "./socket/ISocket";

export class SocketServer<R extends ARealtimeGame<P>, P extends APlayer>
{
	private static readonly MIN_BINDED_PORT = 1024;
	private static readonly MAX_BINDED_PORT = 65535;
	private readonly gameRooms:R[] = [];
	private readonly bindedPorts = new Map<SocketServer.Type, ServerPort>();
	private readonly servers:IServer[] = [];

	constructor(private readonly RoomInstanciator:(new () => R), 
		private readonly PlayerInstanciator:(new () => P))
	{
		
	}

	/**
	 * Instanciate a Player object and bind it to an ISocket.
	 * It also add the player to the room, and instanciate a new one if all are filled.
	 */
	private instanciatePlayerToRoom = (socket:ISocket) =>
	{
		let room:R;
		let player:P;

		if (this.gameRooms.length == 0)
			this.gameRooms.push(new this.RoomInstanciator());
		room = this.gameRooms[this.gameRooms.length - 1];
		if (room.isFilled) {
			room = new this.RoomInstanciator();
			this.gameRooms.push(room);
		}
		player = new this.PlayerInstanciator();
		player.socket = socket;
		room.addPlayer(player);
	}

	public bindPort(serverType:SocketServer.Type, port:ServerPort)
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
		this.bindedPorts.forEach((port:ServerPort, key:SocketServer.Type) => {
			if (key == SocketServer.Type.IO)
				this.servers.push(new IoSocketServer(port, this.instanciatePlayerToRoom));
			if (key == SocketServer.Type.TCP)
				this.servers.push(new TcpSocketServer(port, this.instanciatePlayerToRoom));
		});
	}
};

export module SocketServer
{
	export enum Type
	{
		IO,
		WS,
		TCP
	};
};