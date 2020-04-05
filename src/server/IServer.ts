import { ISocket } from "../socket/ISocket";

export type ServerCallback = (socket:ISocket) => void;
export type ServerPort = number;

export interface IServer
{
	readonly PORT:ServerPort;
};