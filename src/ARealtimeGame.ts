import { APlayer } from "./APlayer";
import { IReceivedPacket, ISendPacket } from "./Packet";
import { PlayerId } from "./types/PlayerId";
import { SocketEvent } from "./types/SocketEvent";

export type ReceiveCallback<T extends IReceivedPacket, P extends APlayer> = ((data:T) => void) | ((data:T, sender:P) => void);

export abstract class ARealtimeGame<P extends APlayer>
{
	private readonly players = new Map<PlayerId, P>();
	private readonly registeredEvents = new Map<SocketEvent, Function>();
	private hasStarted:boolean = false;
	private _hasEnded:boolean = false;
	
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

	/**
	 * Run an iterator through all the players.
	 * It is possible to access to the current player variable via the *callback* parameter.
	 * You can also use a filter callback (optional) to apply the function to only some instances.
	 *
	 * @params callback:(player:<P extends APlayer>) => void = The callback to execute for every player.
	 * @params (optional) filter:(player:<P extends APlayer) => boolean
	 * @returns A number representing the number of instances that has been affected by your callback.
	 */
	protected readonly applyToAllPlayers = (callback:(player:P) => void, filter?:(player:P) => boolean):number =>
	{
		let output = 0;
		
		this.players.forEach((p:P) => {
			if (!filter || filter(p)) {
				callback(p);
				output++;
			}
		});
		return (output);
	}

	/**
	 * This method will prepare a socket event to be registered.
	 * Just before the game start, all the receive events will be automatically binded.
	 * If you call this method after the game started, the event will instantly be binded.
	 *
	 * @params event:SocketEvent
	 * @params callback:(p:<T extends IReceivedPacket>)
	 */
	protected readonly registerReceiveEvent = <T extends IReceivedPacket>(event:SocketEvent, callback:ReceiveCallback<T, P>) =>
	{
		this.registeredEvents.set(event, callback);
		if (this.hasStarted) {
			this.applyToAllPlayers((player:P) => {
				player.on(event, (data:T) => {
					callback(data, player);
				});
			});
		}
	}

	protected readonly stop = () =>
	{
		this._hasEnded = true;
		this.close();
	}

	/**
	 * This method is called when a room is filled, so a game can start.
	 * Override this method to implement your game-logic.
	 */
	protected abstract run():void;

	protected abstract close():void;

	/**
	 * This method is automatically called when a player join the room.
	 * If you don't override this method, by default, it will send a "on_player_join" event to all players in the room.
	 * But you can override this method to implement your own behavior.
	 *
	 * @params player:<P extends APlayer> = An object representing the player who joined the room.
	 */
	protected onPlayerJoin(player:P):void
	{
		player;
	}

	/**
	 * This method is automatically called when a player leave the room.
	 * If you don't override this method, by default, it will send a "on_player_leave" event to all players in the room.
	 * But you can override this method to implement your own behavior.
	 *
	 * @params player:<P extends APlayer> = An object representing the player who joined the room.
	 */
	protected onPlayerLeave(player:P):void
	{
		player;
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

	get isFilled()
	{
		return (this.players.size == this.ROOM_CAPACITY);
	}

	get hadEnded()
	{
		return (this._hasEnded);
	}
};