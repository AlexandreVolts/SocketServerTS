import net from "net";
import { ISocket, SocketId, SocketIp } from "./ISocket";
import { ISendPacket, IReceivedPacket } from "./../Packet";
import { SocketEvent } from "./../types/SocketEvent";

export class TcpSocket implements ISocket
{
	private readonly events = new Map<SocketEvent, Function>();
	readonly ID:SocketId;
	readonly IP:SocketIp;

	constructor(private socket:net.Socket)
	{
		const IP = this.socket.address();
		
		//This kind of id generation should be temporary.
		this.ID = new Date().getTime().toString(16);
		if (typeof IP === "string")
			this.IP = IP;
		else
			this.IP = IP.address;
		this.socket.on("data", this.parseRawData);
		this.socket.on("end", () => {
			this.destroy();
		})
	}

	private parseRawData = (data:Buffer) =>
	{
		let dataAsStr:string = data.toString();
		let output:IReceivedPacket;

		try {
			output = JSON.parse(dataAsStr);
			this.events.forEach((callback:Function, key:SocketEvent) => {
				if (key == output.eventName)
					callback(output);
			})
		}
		catch (e) {
			this.socket.emit("error", `Failed to parse data: ${dataAsStr}.`);
		}
	}
	
	public on<T extends IReceivedPacket>(event:SocketEvent, callback:(data:T) => void)
	{
		this.events.set(event, callback);
	}
	public send<T extends ISendPacket>(event:SocketEvent, data:T)
	{
		data.eventName = event;
		this.socket.write(JSON.stringify(data));
	}
	public destroy()
	{
		this.socket.removeAllListeners();
		this.socket.destroy();
	}
}