import * as Foundation from "foundationjs";
import { AccessRepository } from "../../repositories";
import { App, ServerConfig } from "../../utils";

interface Config {
    readonly servers: readonly ServerConfig[];
}

interface Context {
    readonly access: AccessRepository;
}

export class StartServer extends Foundation.Command<Config, Context, any, string> {
    public readonly description = "Starts a server";
    public readonly property = null;

    public async execute(): Promise<string> {
        const server = new App(this.context.access);

        server.init();
        server.start(...this.config.servers);

        return "server started";
    }
}