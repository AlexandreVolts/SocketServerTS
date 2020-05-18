import { APlayer } from "./APlayer";
import { ARealtimeGame } from "./ARealtimeGame";
import { ISocket } from "./socket/ISocket";

export class RoomInstanciator<R extends ARealtimeGame<P>, P extends APlayer>
{
	private readonly gameRooms:R[] = [];
	
	constructor(private readonly RoomInstanciator:(new () => R), 
		private readonly PlayerInstanciator:(new () => P))
	{

	}

	/**
	 * Instanciate a Player object and bind it to an ISocket.
	 * It also add the player to the room, and instanciate a new one if all are filled.
	 */
	public instanciatePlayerToRoom = (socket:ISocket) =>
	{
		let room:R;
		let player:P;

		if (this.gameRooms.length == 0)
			this.gameRooms.push(new this.RoomInstanciator());
		room = this.gameRooms[this.gameRooms.length - 1];
		if (room.isFilled) {
			room = new this.RoomInstanciator();
			this.gameRooms.push(room);
		}
		player = new this.PlayerInstanciator();
		player.socket = socket;
		room.addPlayer(player);
	}
}