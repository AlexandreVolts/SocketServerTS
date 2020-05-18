import socketio from "socket.io";
import { ASocket } from "./ASocket";
import { IReceivedPacket, ISendPacket } from "./../Packet";
import { SocketEvent, SocketId, SocketIp } from "./../types/SocketTypes";

export class IoSocket extends ASocket
{
	readonly ID:SocketId;
	readonly IP:SocketIp;

	constructor(private readonly socket:socketio.Socket)
	{
		super();
		this.ID = socket.id;
		this.IP = socket.handshake.address
	}

	public on<T extends IReceivedPacket>(event:SocketEvent, callback:(data:T) => void)
	{
		this.remove(event);
		super.on(event, callback);
		this.socket.on(event, callback);
	}
	public send<T extends ISendPacket>(event:SocketEvent, data:T)
	{
		this.socket.emit(event, data);
	}
	public remove(event:SocketEvent):boolean
	{
		let callback = this.getEvent(event);
		
		if (!callback)
			return (false);
		super.remove(event);
		this.socket.removeListener(event, <(data:any) => void>callback);
		return (true);
	}
	public destroy():void
	{
		this.socket.removeAllListeners();
	}
}