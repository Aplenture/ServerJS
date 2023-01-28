import * as Foundation from "foundationjs";
import { AppConfig, ServerConfig } from "../../models";
import { AccessRepository } from "../../repositories";
import { App } from "../../utils";

interface Config extends AppConfig {
    readonly servers: readonly ServerConfig[];
}

interface Context {
    readonly access: AccessRepository;
}

export class StartServer extends Foundation.Command<Config, Context, any, string> {
    public readonly description = "Starts a server";
    public readonly property = null;

    public async execute(): Promise<string> {
        const server = new App(this.context.access, this.config);

        server.start(...this.config.servers);

        return "server started";
    }
}