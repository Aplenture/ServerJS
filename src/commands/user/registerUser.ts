import * as Foundation from "foundationjs";
import { AccessRepository, AccountRepository } from "../../repositories";
import { JSONResponse, OKResponse } from "../../responses";
import { Command, Response } from "../../utils";

const DURATION_EXPIRATION = Foundation.Milliseconds.Hour;

interface Args {
    readonly username: string;
    readonly password: string;
    readonly publickey: string;
    readonly label: string;
    readonly access: boolean;
}

interface Context {
    readonly accounts: AccountRepository;
    readonly access: AccessRepository;
}

export class RegisterUser extends Command<void, Context, Args>{
    public readonly isPrivate = false;
    public readonly description = "Creates a new account and optionaly a temporary access.";
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.StringProperty("username", "For account."),
        new Foundation.StringProperty("password", "For account.", true),
        new Foundation.StringProperty("publickey", "From password.", true),
        new Foundation.StringProperty("label", "To assign creator of temporary open access for created account.", true),
        new Foundation.BoolProperty("access", "Flag to create temporary access too.", true)
    );

    public async execute(args: Args): Promise<Response> {
        const seed = !args.publickey && (args.password || Foundation.randomPassword(6));
        const publicKey = args.publickey || Foundation.EC.secp256k1.createPublicKey(Foundation.EC.createPrivateKey(seed));

        const account = await this.context.accounts.create(args.username, publicKey.toString());

        if (!args.access)
            return new OKResponse();

        const access = await this.context.access.create(account.id, args.label, DURATION_EXPIRATION);

        return new JSONResponse(access);
    }
}