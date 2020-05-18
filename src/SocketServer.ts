import { APlayer } from "./APlayer";
import { ARealtimeGame } from "./ARealtimeGame";
import { IReceivedPacket } from "./Packet";
import { RoomInstanciator } from "./RoomInstanciator";
import { IServer, ServerPort } from "./server/IServer";
import { IoSocketServer } from "./server/IoSocketServer";
import { TcpSocketServer } from "./server/TcpSocketServer";
import { WebSocketServer } from "./server/WebSocketServer";
import { ISocket } from "./socket/ISocket";

type ServerData = {type:SocketServer.Type, port:ServerPort, server?:IServer};

export class SocketServer<R extends ARealtimeGame<P>, P extends APlayer>
{
	private static readonly MIN_BINDED_PORT = 1024;
	private static readonly MAX_BINDED_PORT = 65535;
	private static readonly DEFAULT_ROOMPATH_NAME = "default";
	protected readonly roomInstanciators = new Map<string, RoomInstanciator<R, P>>();
	private readonly servers:ServerData[] = [];
	public enablePrivateRooms = false;

	constructor(RInstanciator?:(new () => R), PInstanciator?:(new () => P))
	{
		let ri:RoomInstanciator<R, P>;
		
		if (RInstanciator && PInstanciator) {
			ri = new RoomInstanciator(RInstanciator, PInstanciator);
			this.roomInstanciators.set(SocketServer.DEFAULT_ROOMPATH_NAME, ri);
		}
	}

	private setupPlayer(socket:ISocket)
	{
		let defaultInstanciator = this.roomInstanciators.get(SocketServer.DEFAULT_ROOMPATH_NAME);

		if (defaultInstanciator) {
			defaultInstanciator.instanciatePlayerToRoom(socket);
			return;
		}
		socket.on("room", (packet:RoomIdentityPacket) => {
			let instanciator = this.roomInstanciators.get(packet.room);

			if (!instanciator)
				return;
			socket.remove("room");
			instanciator.instanciatePlayerToRoom(socket);
		});
	}
	
	/**
	 *
	 */
	public bindPort(serverType:SocketServer.Type, port:ServerPort)
	{
		if (port < SocketServer.MIN_BINDED_PORT || port > SocketServer.MAX_BINDED_PORT)
			return;
		for (let i = this.servers.length - 1; i >= 0; i--) {
			if (this.servers[i].port == port)
				return;
		}
		this.servers.push(<ServerData>{type: serverType, port: port});
	}

	/**
	 * Creates the servers whose a port has been binded to, and set them ready to listen to sockets on this port.
	 */
	public run():boolean
	{
		if (this.roomInstanciators.size == 0)
			return (false);
		this.servers.forEach((s:ServerData) => {
			if (s.type == SocketServer.Type.IO)
				s.server = new IoSocketServer(s.port, this.setupPlayer);
			if (s.type == SocketServer.Type.TCP)
				s.server = new TcpSocketServer(s.port, this.setupPlayer);
			if (s.type == SocketServer.Type.WS)
				s.server = new WebSocketServer(s.port, this.setupPlayer);
		});
		return (true);
	}
};

interface RoomIdentityPacket extends IReceivedPacket
{
	room:string;
}

export module SocketServer
{
	export enum Type
	{
		IO,
		TCP,
		WS
	};
};