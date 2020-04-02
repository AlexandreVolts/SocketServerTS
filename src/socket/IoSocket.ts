import socketio from "socket.io";
import { ISocket, SocketId, SocketIp } from "./ISocket";
import { IReceivedPacket, ISendPacket } from "./../Packet";
import { SocketEvent } from "./../types/SocketEvent";

export class IoSocket implements ISocket
{
	readonly ID:SocketId;
	readonly IP:SocketIp;

	constructor(private readonly socket:socketio.Socket)
	{
		this.ID = socket.id;
		this.IP = socket.handshake.address;
	}

	public on<T extends IReceivedPacket>(event:SocketEvent, callback:(data:T) => void)
	{
		this.socket.on(event, (data:T) => {
			callback(data);
		});
	}
	public send<T extends ISendPacket>(event:SocketEvent, data:T)
	{
		this.socket.emit(event, data);
	}
	public destroy():void
	{
		this.socket.removeAllListeners();
	}
}