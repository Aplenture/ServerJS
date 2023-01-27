import { Log, App } from "../utils";

export interface Context {
    readonly server: App;
    readonly log: Log;
}