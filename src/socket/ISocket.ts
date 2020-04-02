import { ISendPacket, IReceivedPacket } from "./../Packet";
import { SocketEvent } from "./../types/SocketEvent";

export type SocketId = string;
export type SocketIp = string;

export interface ISocket
{
	readonly ID:SocketId;
	readonly IP:SocketIp;

	/**
	 * Set a callback to handle data received from an event.
	 * The callback will receive as parameter an object extending the IReceivedPacket interface.
	 *
	 * @params event:SocketEvent
	 * @params callback:(data:<T extends IReceivedPacket>) = Describe what the program must do with data (passed as parameter)
	 */
	on<T extends IReceivedPacket>(event:SocketEvent, callback:(data:T) => void):void;
	
	/**
	 * Receive data from a server-side socket.
	 * The sended data must be implements the ISendPacket interface.
	 *
	 * @params event:SocketEvent
	 * @params data:<T extends ISendPacket>
	 */
	send<T extends ISendPacket>(event:SocketEvent, data:T):void;

	/**
	 * Disable all listeners, and destroy the socket if needed.
	 */
	destroy():void;
};