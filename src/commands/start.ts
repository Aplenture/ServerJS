import * as Foundation from "foundationjs";
import { Context } from "../models/context";
import { ServerConfig } from "../utils";

interface Args {
    readonly configs: ReadonlyArray<ServerConfig>;
}

export class Start extends Foundation.Command<Context, Args, void> {
    public async execute(args: Args): Promise<void> {
        this.context.server.start(...args.configs);
        this.context.log.write("server started");
    }
}