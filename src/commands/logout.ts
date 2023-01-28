import * as Foundation from "foundationjs";
import { AccessRepository } from "../repositories";
import { OKResponse } from "../responses";
import { Command, Response } from "../utils";

interface Args {
    readonly session: string;
}

interface Context {
    readonly access: AccessRepository;
}

export class Logout extends Command<any, Context, Args> {
    public readonly isPrivate = true;
    public readonly description = "Closes the access."
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.StringProperty("session", "Session from access to close.")
    );

    public async execute(args: Args): Promise<Response> {
        const access = await this.context.access.getByAPI(args.session);

        if (!access)
            throw new Foundation.UnauthorizedError('#_login_invalid');

        await this.context.access.delete(access.id);

        this.message(`delete access '${access.id}'`);

        return new OKResponse();
    }
}