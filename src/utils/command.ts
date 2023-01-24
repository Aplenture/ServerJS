import * as Foundation from "foundationjs";
import { Context } from "../models/context";
import { Response } from "./response";

export abstract class Command<TContext extends Context, TArgs> extends Foundation.Command<TContext, TArgs, Response> {
    public abstract readonly isPrivate: boolean;
}