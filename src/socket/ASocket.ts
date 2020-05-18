import { ISocket } from "./ISocket";
import { IReceivedPacket, ISendPacket } from "./../Packet";
import { SocketEvent, SocketId, SocketIp} from "./../types/SocketTypes";

export abstract class ASocket implements ISocket
{
	private readonly events = new Map<SocketEvent, Function>();
	abstract readonly ID:SocketId;
	abstract readonly IP:SocketIp;

	protected readonly getEvent = (event?:SocketEvent) =>
	{
		if (!event)
			return (undefined);
		return (this.events.get(event));
	}
	public on<T extends IReceivedPacket>(event:SocketEvent, callback:(data:T) => void)
	{
		this.events.set(event, callback);
	}

	public remove(event:SocketEvent):boolean
	{
		return (this.events.delete(event));
	}
	abstract send<T extends ISendPacket>(event:SocketEvent, data:T):void;
	abstract destroy():void;
}