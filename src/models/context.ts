import { Log, Server } from "../utils";

export interface Context {
    readonly server: Server;
    readonly log: Log;
}