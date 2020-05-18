import { PlayerId } from "./types/PlayerId";

interface IPacket
{
	event?:string;
};

export interface IReceivedPacket extends IPacket
{

};

export interface ISendPacket extends IPacket
{
	senderId?:PlayerId;
};