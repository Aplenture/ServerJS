import * as Foundation from "foundationjs";
import { Context } from "../models";
import { ServerConfig } from "../utils";

interface Config {
    readonly servers: readonly ServerConfig[];
}

export class Start extends Foundation.Command<Config, Context, any, void> {
    public readonly description = "Starts the server";
    public readonly property = null;

    public async execute(): Promise<void> {
        this.context.server.start(...this.config.servers);
        this.context.log.write("server started");
    }
}