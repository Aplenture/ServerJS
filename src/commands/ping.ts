import { TextResponse } from "../responses";
import { Command, Response } from "../utils";

export class Ping extends Command<any, any, any> {
    public readonly isPrivate = false;
    public readonly description = "Returns 'pong'.";
    public readonly property = null;

    public async execute(): Promise<Response> {
        return new TextResponse('pong');
    }
}