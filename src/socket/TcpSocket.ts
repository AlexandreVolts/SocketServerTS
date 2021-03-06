import net from "net";
import { ASocket } from "./ASocket";
import { ISendPacket, IReceivedPacket } from "./../Packet";
import { SocketEvent, SocketId, SocketIp } from "./../types/SocketTypes";

export class TcpSocket extends ASocket
{
	//This kind of id generation should be temporary.
	readonly ID:SocketId = new Date().getTime().toString(16);
	readonly IP:SocketIp;

	constructor(private socket:net.Socket)
	{
		super();
		const IP = this.socket.address();

		if (typeof IP === "string")
			this.IP = IP;
		else
			this.IP = IP.address;
		this.socket.on("data", this.parseRawData);
		this.socket.on("end", this.destroy);
	}

	private parseRawData = (data:Buffer) =>
	{
		let dataAsStr:string = data.toString();
		let output:IReceivedPacket;
		let callback:Function|undefined;

		try {
			output = JSON.parse(dataAsStr);
			callback = this.getEvent(output.event);
			if (callback)
				callback(output);
		}
		catch (e) {
			this.socket.write(`Error: Failed to parse data: ${dataAsStr}.`);
		}
	}

	public send<T extends ISendPacket>(event:SocketEvent, data:T)
	{
		data.event = event;
		this.socket.write(JSON.stringify(data));
	}
	public destroy()
	{
		this.socket.removeAllListeners();
		this.socket.destroy();
	}
}