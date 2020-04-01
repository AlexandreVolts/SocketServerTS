import socketio from "socket.io";
import { IPacket } from "./IPacket";
import { ISocket, SocketId, SocketIp } from "./ISocket";

export class IoSocket implements ISocket
{
	readonly ID:SocketId;
	readonly IP:SocketIp;

	constructor(private socket:socketio.Socket)
	{
		this.ID = socket.id;
		this.IP = socket.handshake.address;
	}

	public on<T extends IPacket>(event:string, callback:(data:T) => void)
	{
		this.socket.on(event, (data:T) => {
			data.command = event;
			callback(data);
		});
	}
	public send<T extends IPacket>(event:string, data:T)
	{
		data.command = event;
		this.socket.emit(event, data);
	}
	public destroy():void
	{
		this.socket.removeAllListeners();
	}
}