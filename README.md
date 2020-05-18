# Etwin Server Socket Library Showcase

A week ago, I told Demurgos I wanted to develop a library that will simplify at lot realtime games development.

Because they are all more or less built the same way, I thought it was simpler for us to have a common thing about that, so everyone will not have to reinvent the wheel (In NodeJS/NodeTS at least).

Here is my work:

**This library force you to be focused on the game development, socket a nearly managed in a automated way, so you don't have to write "socket" word a single time**

It follows the SOLID philosophy, so you'll have to extend classes inside the lib (2 abstract classes and 2 interface)

## Here is a simple way to make an anonymous chat:
```ts
import { APlayer, ARealtimeGame, ISendPacket, IReceivedPacket } from "etwin-socket-server";

export class ChatUser extends APlayer
{
	username?:string;
}

export class MyWonderfulChat extends ARealtimeGame<ChatUser>
{
	private static readonly MAX_SIMULTANEOUS_CONNECTIONS = 10;
	
	constructor()
	{
		super(MyWonderfulChat.MAX_SIMULTANEOUS_CONNECTIONS);

		this.on("receive_message", (packet:MessagePacket, emitter:ChatUser) =>
		{
			this.broadcast("send_message", <MessagePacket>{
				message: MyWonderfulChat.format(emitter.username, packet.message)
			});
		}
	}
}

interface MessagePacket extends IReceivedPacket, ISendPacket
{
	message:string;
}

```
You have to extend ```APlayer``` & ```ARealtimeGame<P extends APlayer>``` classes, the first to represent your player data, and the other to represent the game in itself (In more long program, it is suggested to only have a file for each part).

You can listen to any event with the ```this.on``` function, broadcast a message with ```this.broadcast```, or send a message to a specific user or group of users, but we'll see it below.

There is only around 20 lines of codes, it is not a lot to make a chat, I think, but that's not all: In another file (an index.ts for exemple)

```ts
import { MyWonderfulChat, ChatUser } from "./MyWonderfulChat";

function main()
{
	const ss = new SocketServer(MyWonderfulChat, ChatUser);

	ss.bindPort(SocketServer.Type.IO, 3000);
	ss.bindPort(SocketServer.Type.TCP, 3001);
	ss.run();
}
```
You'll have to instanciate a SocketServer, and pass your game and your player constructors as parameters. The SocketServer creates the type of socket server you asked for, to the port you binded with ```bindPort``` function. 

If you choose to bind multiple ports, to multiple server-types, sockets of the SocketServer can communicate accross protocols and ports. (That's the power of abstraction <3)

For example, if you have 3 TCP players and 5 socket.IO players in a single room, they should be able to communicate without any problem. (But TCP will receive server data in a JSON format, and I absolutely don't know if it is a good idea ?).

It also instanciates Rooms & Players for you (It is the reason why you have to pass their constructor), so you haven't to manage this part of the code. It means that if your game reach the maximum number of established connections (like, 50 in Majority, 8 in SQ, 2 in CafeJeux), a new one is automatically created. As I explained before, with this lib you can focus on the game-logic without thinking about anything else.

## Next thing: Make our chat not anonymous !

By default new connections are anonymous, only identified by an id. So let's ask our player its little name.

```ts
export class MyWonderfulChat extends ARealtimeGame<ChatUser>
{
	private static readonly MAX_SIMULTANEOUS_CONNECTIONS = 10;

	constructor()
	{
		super(MyWonderfulChat.MAX_SIMULTANEOUS_CONNECTIONS);

		this.on("join", (packet:LoginPacket, emitter:ChatUser) => {
			emitter.username = packet.username;
			this.broadcast("send_message", <MessagePacket>{
				message: MyWonderfulChat.format(emitter.username, "joined the room !")
			});
		}
		//receive_message event here
	}
}

interface LoginPacket extends IReceivedPacket
{
	username:string;
}
```
You could ask yourself "Why I must always extends IReceivedPacket/ISendPacket classes for each of my packet, that's boring !".

The reason is simple: It will be much simpler for you to create documentation of each of your packet in this way. You'll exactly know what they contain, it limits a lot the surprises you could have with undefined terms *(which can always occurs if front-end send a wrong packet, but at least your packets were documented)*.

*Note: You are not concerned if you use the JS version*

## Private messages & sub-group messages

### Private message

```ts
export class MyWonderfulChat extends ARealtimeGame<ChatUser>
{
	constructor()
	{
		//super, join & receive_message event here
		this.on("receive_private_message", (packet:PrivateMessagePacket, emitter:ChatUser) => {
			this.filter((p) => packet.username === p.username).apply((p) => {
				p.send("send_private_message", <MessagePacket>{
					message: MyWonderfulChat.format(emitter.username, packet.message)
				});
			});
		}
	}
}

interface PrivateMessagePacket extends IReceivedPacket
{
	username:string;
	message:string;
}
```

The ```this.filter``` function accepts a callback as parameter, which accept a player, and returns a ```PlayerList``` object where every player that does not match the condition is rejected from the list.

```this.apply``` apply the callback passed as paramater to every player in the PlayerList. They can be chain-called as shown in the example above, to filter + apply in same time.

A last thing: To avoid filter all the players, if your PrivateMessagePacket send the id of the player instead of its username, you can do:

```ts
let p = this.getPlayer(packet.receiverId);

if (p) {
	p.send("send_private_message", <MessagePacket>{
		message: MyWonderfulChat.format(emitter.username, packet.message)
	});
}
```

```this.getPlayer``` lets you access to a player through its id, generated by the server in the ```APlayer``` class (and, as a reminder: The class you create to represent the player MUST extends the ```APlayer``` class).

### Sub-group message

Let's transform our chat to make it becomes a LGeL chat game

```ts
export class ChatUser extends APlayer
{
	// Let's assure a player has a 33% chances to be a werewolf.
	public readonly IS_LG:boolean = Math.random() < 0.33;
	public username?:string;
};

export class MyWonderfulChat extends ARealtimeGame<ChatUser>
{
	constructor()
	{
		//super, join, receive_message, private message events here
		this.registerReceiveEvent("receive_lg_message", (packet:MessagePacket, emitter:ChatUser) => {
			this.filter((p) => p.IS_LOUP_GAROU).apply((p) => {
			p.send("send_lg_message", <MessagePacket>{
				message: MyWonderfulChat.format("Anonymous wolfwere", packet.message)
			});
		});
	}

	protected run()
	{
		this.apply((p) => {
			p.send("start_game", <PlayerInfosPacket>{isLg: p.IS_LG});
		});
		this.broadcast("start_game", <MessagePacket>{
			message: "***THE GAME STARTS NOW***"
		});
	}
	protected close()
	{

	}
}

interface PlayerInfosPacket extends ISendPacket
{
	isLg:boolean;
}
```

You can ask multiple things:

**- "What are the those "run" and "close" functions ???**

*In fact, I didn't wrote them before, but your program may not compile or crash if you don't use them.*

The ```this.run``` function is called when the game is filled. It is a bit like the "entry point" or the "main" of your game.

So it is where you should initialise everything you need, and then run the game.

The ```this.close``` function is called when you call the ```this.stop``` function *(yes, guess what: My code can't know when you game ends, so you have to tell it by calling this function)*.

It is called just before all sockets are destroyed, and just before the game room is deleted *(At this point you MUST create this function, but it may be facultative in future releases)*.

**- "What is the difference between ```this.on``` and ```this.registerReceiveEvent``` ?"**

The only difference, is that an event listened by ```this.registerReceiveEvent``` can only be listened **after the game starts**, so it let you make the difference between your "game" events and your "i-can-be-used-at-any-time" events *(In fact the usage of ```this.on``` can be avoided if your players don't need to send anything before the game starts, and it is generally only used for a chatroom system)*.

### A Full example

```ts
import { APlayer, ARealtimeGame, ISendPacket, IReceivedPacket } from "etwin-socket-server";

//Suggested in a ChatUser.ts
export class ChatUser extends APlayer
{
	public readonly IS_LG:boolean = Math.random() % 3 < 1;
	public username?:string;
};

//Suggested in a MyWonderfulchat.ts
export class MyWonderfulChat extends ARealtimeGame<ChatUser>
{
	private static readonly MAX_SIMULTANEOUS_CONNECTIONS = 10;
	
	constructor()
	{
		super(MyWonderfulChat.MAX_SIMULTANEOUS_CONNECTIONS);
		
		//On new connection
		this.on("connect", this.onConnect);
		
		//On new global message received
		this.on("receive_message", this.onReceiveMessage);
		
		//On new message sent
		this.registerReceiveEvent("receive_lg_message", this.onReceiveLgMessage);

		//On private message
		this.registerReceiveEvent("receive_private_message", this.onReceivePrivateMessage);
	}
	
	//This mysterious "format" function I used but didn't explained ;)
	private static format(username:string|undefined, message:string):string
	{
		if (!username)
			return (MyWonderfulChat.format("Anonymous", message));
		return (`<b>&lt;${username}&gt;</b> ${message}`);
	}
	private onConnect(packet:ConnectionPacket, emitter:ChatUser)
	{
		emitter.username = packet.username;
		emitter.send("connection_established", <MessagePacket>{
			message: `Hello to you and welcome to the chat, ${packet.username}!`
		});
		this.broadcast("new_player_connected", <MessagePacket>{
			message: MyWonderfulChat.format(packet.username, "joined the chat!")
		});
	}
	private onReceiveMessage(packet:MessagePacket, emitter:ChatUser)
	{
		this.broadcast("send_message", <MessagePacket>{
			message: MyWonderfulChat.format(emitter.username, packet.message)
		});
	}
	private onReceiveLgMessage(packet:MessagePacket)
	{
		this.filter((p) => p.IS_LG).apply((p) => {
			p.send("send_lg_message", <MessagePacket>{
				message: MyWonderfulChat.format("Anonymous wolf", packet.message)
			});
		});
	}
	private onReceivePrivateMessage(packet:PrivateMessage, emitter:ChatUser)
	{
		this.filter((p) => packet.username === p.username).apply((p) => {
			p.send("send_private_message", <MessagePacket>{
				message: MyWonderfulChat.format(emitter.username, packet.message)
			});
		});
	}
	
	protected run()
	{
		this.apply((p) => {
			p.send("start_game", <PlayerInfosPacket>{isLg: p.IS_LG});
		});
		this.broadcast("start_game", <MessagePacket>{
			message: "***THE GAME STARTS NOW***"
		});
	}
	protected close()
	{

	}
}

//Suggested in a MyGamePackets.ts
interface ConnectionPacket extends IReceivedPacket
{
	username:string;
}
interface PrivateMessage extends IReceivedPacket
{
	username:string;
	message:string;
}
interface PlayerInfosPacket extends ISendPacket
{
	isLg:boolean;
}
interface MessagePacket extends IReceivedPacket, ISendPacket
{
	message:string;
}

//Suggested in an index.ts
async function main():Promise<void>
{
	const ss = new SocketServer(MyWonderfulChat, ChatUser);

	ss.bindPort(SocketServer.Type.IO, 3000);
	ss.bindPort(SocketServer.Type.TCP, 3001);
	ss.run();
}

main().catch((err:Error) => {
	console.log(err.stack);
	process.exit(1);
});
```