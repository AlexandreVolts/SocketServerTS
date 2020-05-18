import ws from "websocket";
import { ASocket } from "./ASocket";
import { ISendPacket, IReceivedPacket } from "./../Packet";
import { SocketEvent, SocketId, SocketIp } from "./../types/SocketTypes";

export class WebSocket extends ASocket
{
	//This kind of id generation should be temporary.
	readonly ID:SocketId  = new Date().getTime().toString(16);
	readonly IP:SocketIp;

	constructor(private socket:ws.connection)
	{
		super();
		this.IP = this.socket.remoteAddress;
		this.socket.on("message", this.parseRawData);
		this.socket.on("close", this.destroy);
	}

	private parseRawData = (data:ws.IMessage) =>
	{
		let dataAsStr:string|undefined = data.utf8Data;;
		let output:IReceivedPacket;
		let callback:Function|undefined;

		if (!dataAsStr || data.type !== "uft8") {
			this.socket.sendUTF("Error: Data type is not a string.");
			return;
		}
		try {
			output = JSON.parse(dataAsStr);
			callback = this.getEvent(output.event);
			if (callback)
				callback(output);
		}
		catch (e) {
			this.socket.sendUTF(`Error: Failed to parse data: ${dataAsStr}.`);
		}
	}

	public send<T extends ISendPacket>(event:SocketEvent, data:T)
	{
		data.event = event;
		this.socket.sendUTF(JSON.stringify(data));
	}
	public destroy()
	{
		this.socket.removeAllListeners();
	}
}