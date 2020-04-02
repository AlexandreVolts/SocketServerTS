import { IReceivedPacket, ISendPacket } from "./Packet";
import { ISocket } from "./socket/ISocket";
import { PlayerId } from "./types/PlayerId";

export abstract class APlayer
{
	// It is a temporary id generation.
	public readonly ID:PlayerId = (~~(Math.random() * 100000)).toString(16);

	constructor(private readonly socket:ISocket)
	{

	}
	
	public readonly on = <T extends IReceivedPacket>(event:string, callback:(data:T) => void) =>
	{
		this.socket.on(event, callback);
	}
	
	/**
	 * This method automatically fill the "id" field of the packet which must be sent.
	 */
	public readonly send = <T extends ISendPacket>(event:string, data:T) =>
	{
		data.senderId = this.ID;
		this.socket.send(event, data);
	}
};