import * as Foundation from "foundationjs";
import { Response } from "./response";

export abstract class Command<TConfig, TContext, TArgs> extends Foundation.Command<TConfig, TContext, TArgs, Response> {
    public abstract readonly isPrivate: boolean;
}