import * as Foundation from "foundationjs";
import { Config, Context } from "../models";
import { Response } from "./response";

export abstract class Command<TConfig extends Config, TContext extends Context, TArgs> extends Foundation.Command<TConfig, TContext, TArgs, Response> {
    public abstract readonly isPrivate: boolean;
}