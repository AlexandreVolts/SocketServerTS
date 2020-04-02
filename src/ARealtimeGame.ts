import { APlayer } from "./APlayer";
import { IReceivedPacket, ISendPacket } from "./Packet";
import { PlayerId } from "./types/PlayerId";
import { SocketEvent } from "./types/SocketEvent";

export type ReceiveCallback<T extends IReceivedPacket, P extends APlayer> = ((data:T) => void) | ((data:T, sender:P) => void);

export abstract class ARealtimeGame<P extends APlayer>
{
	private static readonly ON_PLAYER_JOIN_EVENT_NAME = "join";
	private static readonly ON_PLAYER_LEAVE_EVENT_NAME = "leave";
	private readonly players = new Map<PlayerId, P>();
	private readonly registeredEvents = new Map<SocketEvent, Function>();
	private hasStarted:boolean = false;
	
	constructor(private readonly ROOM_CAPACITY:number = 2)
	{

	}

	private prerun():void
	{
		this.applyToAllPlayers((player:P) => {
			this.registeredEvents.forEach((callback:Function, key:SocketEvent) => {
				player.on(key, (data:IReceivedPacket) => {
					callback(data, player);
				});
			});
		});
		this.run();
	}

	protected readonly getPlayer = (id:PlayerId):P|undefined =>
	{
		return (this.players.get(id));
	}

	protected readonly applyToAllPlayers = (callback:(player:P) => void) =>
	{
		this.players.forEach((p:P) => {
			callback(p);
		});
	}

	/**
	 * This method will prepare a socket event to be registered.
	 * Just before the game start, all the receive events will be automatically binded.
	 *
	 * @params event:SocketEvent
	 * @params callback:(p:<T extends IReceivedPacket>)
	 */
	protected readonly registerReceiveEvent = <T extends IReceivedPacket>(event:SocketEvent, callback:ReceiveCallback<T, P>) =>
	{
		this.registeredEvents.set(event, callback);
	}

	/**
	 * This method is called when a room is filled, so a game can start.
	 * Override this method to implement your game-logic.
	 */
	protected abstract run():void;

	protected abstract close():void;

	/**
	 * This method is automatically called when a player join the room.
	 * If you don't override this method, by default, it will send a "join" event to all players in the room.
	 * But you can override this method to implement your own behavior.
	 *
	 * @params player:<P extends APlayer> = An object representing the player who joined the room.
	 */
	protected onPlayerJoin(player:P):void
	{
		this.broadcast(ARealtimeGame.ON_PLAYER_JOIN_EVENT_NAME, <ISendPacket>{id: player.ID});
	}

	/**
	 * This method is automatically called when a player leave the room.
	 * If you don't override this method, by default, it will send a "leave" event to all players in the room.
	 * But you can override this method to implement your own behavior.
	 *
	 * @params player:<P extends APlayer> = An object representing the player who joined the room.
	 */
	protected onPlayerLeave(player:P):void
	{
		this.broadcast(ARealtimeGame.ON_PLAYER_LEAVE_EVENT_NAME, <ISendPacket>{id: player.ID});
	}

	/**
	 * Send a messages to all users of a room.
	 *
	 * @params event:SocketEvent = The event on which all clients will listen to.
	 * @params data:<T extends ISendPacket> = Data to send to all users.
	 */
	public readonly broadcast = <T extends ISendPacket>(event:SocketEvent, data:T) =>
	{
		this.applyToAllPlayers((player:P) => {
			player.send(event, data);
		});
	}
	
	/**
	 * Add a player to the room. The player will be rejected if the room is filled.
	 * If player is already inside the room, its old socket is destroyed and replaced by the new.
	 * Returns true if the player was successfully added, false otherwise.
	 *
	 * @params player:<P extends APlayer>
	 * @returns A boolean indicates whether or not the player has been successfully added.
	 */
	public readonly addPlayer = (player:P):boolean =>
	{
		if (this.players.size >= this.ROOM_CAPACITY)
			return (false);
		this.players.set(player.ID, player);
		this.onPlayerJoin(player);
		if (!this.hasStarted && this.players.size == this.ROOM_CAPACITY) {
			this.hasStarted = true;
			this.prerun();
		}
		return (true);
	}

	/**
	 * Remove a player from the room, regardless of whether the socket is disconnected or not.
	 * Returns true if the player was successfully removed, false otherwise.
	 *
	 * @params player:<P extends APlayer>
	 * @returns A boolean indicates whether or not the player has been successfully removed.
	 */
	public readonly removePlayer = (player:P):boolean =>
	{
		let p = this.getPlayer(player.ID);

		if (!p)
			return (false);
		this.players.delete(p.ID);
		this.onPlayerLeave(player);
		return (true);
	}

	public readonly isFilled = ():boolean =>
	{
		return (this.players.size == this.ROOM_CAPACITY);
	}
};