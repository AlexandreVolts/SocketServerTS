import { APlayer } from "./APlayer";
import { PlayerId } from "./types/PlayerId";

export class PlayerList<P extends APlayer>
{
	private readonly players = new Map<PlayerId, P>();
	
	constructor(players:Map<PlayerId, P>)
	{
		players.forEach((p:P, key:PlayerId) => {
			this.players.set(key, p);
		});
	}

	/**
	 * Run an iterator through all the players ans execute a function on each of them.
	 * It is possible to access to the current player variable via the *callback* passed as parameter.
	 *
	 * @params callback:(player:<P extends APlayer>) => void = The callback to execute for every player.
	 * @returns The PlayerList<P extends APlayer>'s current instance.
	 */
	public apply(callback:(player:P) => void):PlayerList<P>
	{
		this.players.forEach((p:P) => {
			callback(p);
		});
		return (this);
	}

	/**
	 * Remove each player's instance of the list that does not match the condition in your callback.
	 *
	 * @params callback:(player:<P extends APlayer>) => void = The callback to filter players.
	 * @returns The PlayerList<P extends APlayer>'s current instance.
	 */
	public filter(callback:(player:P) => boolean):PlayerList<P>
	{
		this.players.forEach((p:P, key:PlayerId) => {
			if (!callback(p))
				this.players.delete(key);
		});
		return (this);
	}
	
	get length()
	{
		return (this.players.size);
	}
}