import * as Foundation from "foundationjs";
import { Context } from "../models/context";

export class Stop extends Foundation.Command<Context, void, void> {
    public async execute(): Promise<void> {
        this.context.server.stop();
        this.context.log.write("server stopped");
    }
}