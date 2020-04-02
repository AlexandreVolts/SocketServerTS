import { PlayerId } from "./types/PlayerId";

interface IPacket
{
	eventName?:string;
};

export interface IReceivedPacket extends IPacket
{

};

export interface ISendPacket extends IPacket
{
	senderId?:PlayerId;
};