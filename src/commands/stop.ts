import * as Foundation from "foundationjs";
import { Context } from "../models/context";

export class Stop extends Foundation.Command<void, Context, any, void> {
    public readonly description = "Stops the server";
    public readonly property = null;

    public async execute(): Promise<void> {
        this.context.server.stop();
        this.context.log.write("server stopped");
    }
}