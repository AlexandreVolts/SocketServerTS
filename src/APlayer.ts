import { IReceivedPacket, ISendPacket } from "./Packet";
import { ISocket } from "./socket/ISocket";
import { PlayerId } from "./types/PlayerId";

export abstract class APlayer
{
	// It is a temporary id generation.
	public readonly ID:PlayerId = (~~(Math.random() * 0xFFFF)).toString(16).padStart(4, "0");
	private _socket?:ISocket

	constructor()
	{

	}
	
	public readonly on = <T extends IReceivedPacket>(event:string, callback:(data:T) => void) =>
	{
		this._socket?.on(event, callback);
	}
	
	/**
	 * This method automatically fill the "senderId" field of the packet which must be sent.
	 */
	public readonly send = <T extends ISendPacket>(event:string, data:T) =>
	{
		data.senderId = this.ID;
		this._socket?.send(event, data);
	}
	
	set socket(s:ISocket)
	{
		if (!this._socket)
			this._socket = s;
	}
};