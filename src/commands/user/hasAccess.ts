import * as Foundation from "foundationjs";
import { App, Command, Response } from "../../utils";
import { AccessRepository } from "../../repositories";
import { BoolResponse, OKResponse } from "../../responses";

interface Args {
    readonly session: string;
    readonly signature: string;
    readonly timestamp: number;
}

interface Context {
    readonly repositories: {
        readonly access: AccessRepository;
    }
}

export class HasAccess extends Command<void, Context, Args> {
    public readonly isPrivate = false;
    public readonly description = "Returns whether access is valid."
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.StringProperty("sesion", "Access session."),
        new Foundation.StringProperty("signature", "Signatured timestamp."),
        new Foundation.NumberProperty("timestamp", "Validation timestamp.")
    );

    public async execute(args: Args): Promise<Response> {
        const access = await this.context.repositories.access.getByAPI(args.session);
        const time = Date.now();

        if (!App.validateAccess(access, time))
            return new BoolResponse(false);

        if (!App.validateSignature(args.signature, args.timestamp.toString(), access.secret))
            return new BoolResponse(false);

        return new OKResponse();
    }
}