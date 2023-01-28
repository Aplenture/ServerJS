import * as Foundation from "foundationjs";
import { AccessRepository, AccountRepository } from "../repositories";
import { JSONResponse } from "../responses";
import { Command, Response } from "../utils";

const DURATION_DELAY = Foundation.Milliseconds.Second;
const DURATION_SHORT_ACCESS = Foundation.Milliseconds.Day;
const DURATION_LONG_ACCESS = Foundation.Milliseconds.Day * 30;

interface Args {
    readonly timestamp: number;
    readonly username: string;
    readonly sign: string;
    readonly keepLogin?: boolean;
    readonly label?: string;
}

interface Context {
    readonly access: AccessRepository;
    readonly accounts: AccountRepository;
}

export class Login extends Command<void, Context, Args> {
    public readonly isPrivate = false;
    public readonly description = "Creates access to account."
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.NumberProperty("timestamp", "For validation."),
        new Foundation.StringProperty("username", "From account."),
        new Foundation.StringProperty("sign", "From timestamp."),
        new Foundation.BoolProperty("keepLogin", "Keeps access for long time.", true),
        new Foundation.StringProperty("label", "To assign the access creator.", true)
    );

    public async execute(args: Args): Promise<Response> {
        // delay login handling
        // for brute force protection
        await Foundation.sleep(DURATION_DELAY);

        const account = await this.context.accounts.getByName(args.username);

        if (!account)
            throw new Foundation.UnauthorizedError('#_login_invalid');

        const hash = Foundation.toHashInt(args.timestamp.toString());
        const key = Foundation.EC.Point.fromHex(account.key);
        const sign = Foundation.ECDSA.Sign.fromHex(Foundation.parseToString(args.sign, 'sign'));

        if (!Foundation.ECDSA.verify(hash, key, sign))
            throw new Foundation.UnauthorizedError('#_login_invalid');

        const session = Foundation.toHex(Foundation.random(32));
        const secret = Foundation.toHex(Foundation.random(32));
        const created = Date.now();

        const expiration = args.keepLogin
            ? created + DURATION_LONG_ACCESS
            : created + DURATION_SHORT_ACCESS;

        const id = await this.context.access.create(
            created,
            account.id,
            session,
            secret,
            args.label,
            expiration
        );

        this.message(`create access '${id}' for account '${account.id}'`);

        return new JSONResponse({ session, secret });
    }
}