import { ISocket } from "./ISocket";

export abstract class APlayer
{
	constructor(public readonly socket:ISocket)
	{

	}
};