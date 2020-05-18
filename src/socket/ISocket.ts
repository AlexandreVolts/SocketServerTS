import { ISendPacket, IReceivedPacket } from "./../Packet";
import { SocketEvent, SocketId, SocketIp } from "./../types/SocketTypes";


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
	 * Send data from a server-side socket.
	 * The sent data must be implements the ISendPacket interface.
	 *
	 * @params event:SocketEvent
	 * @params data:<T extends ISendPacket>
	 */
	send<T extends ISendPacket>(event:SocketEvent, data:T):void;

	/**
	 * Remove an event linked to a socket.
	 *
	 * @params event:SocketEvent
	 * @returns A boolean indicates if the event could be removed (Nothing was listening on this event if it returns false)
	 */
	remove(event:SocketEvent):boolean;

	/**
	 * Disable all listeners, and destroy the socket if needed.
	 */
	destroy():void;
};