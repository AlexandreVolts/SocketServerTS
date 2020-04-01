import { APlayer } from "./APlayer";
import { SocketId } from "./ISocket";

export abstract class ARealtimeGame<P extends APlayer>
{
	private players:Map<SocketId, P> = new Map<SocketId, P>();
	
	constructor(private readonly ROOM_CAPACITY:number = 2)
	{

	}

	/**
	 * Add a player to the room. The player will be rejected if the room is filled.
	 * If player is already inside the room, its old socket is destroyed and replaced by the new.
	 * Returns true if the player was successfully added, false otherwise.
	 *
	 * @params player:<P extends APlayer>
	 * @returns A boolean indicates whether or not the player has been successfully added.
	 */
	public addPlayer(player:P):boolean
	{
		this.players.set(player.socket.ID, player);
		return (true);
	}

	/**
	 * Remove a player from the room, regardless of whether the socket is disconnected or not.
	 * Returns true if the player was successfully removed, false otherwise.
	 *
	 * @params player:<P extends APlayer>
	 * @returns A boolean indicates whether or not the player has been successfully removed.
	 */
	public removePlayer(player:P):boolean
	{

	}

	public isFilled():boolean
	{
		return (this.players.size == this.ROOM_CAPACITY);
	}

	/**
	 * Returns the reference that are connected to the room.
	 *
	 * @returns An array of players extending the APlayer class.
	 */
	protected getPlayers():P[]
	{
		const output:P[] = [];

		this.players.forEach((player:P) => {
			output.push(player);
		});
		return (output);
	}

	/**
	 * This method is called when a room is filled, so a game can start.
	 * Override this method to implement your game-logic.
	 */
	protected abstract run():void;
	protected abstract close():void;
};