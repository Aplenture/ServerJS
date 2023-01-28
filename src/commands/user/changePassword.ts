import * as Foundation from "foundationjs";
import { AccountRepository } from "../../repositories";
import { OKResponse } from "../../responses";
import { Command, Response } from "../../utils";

interface Args {
    readonly account: number;
    readonly publickey_old: string;
    readonly publickey_new: string;
}

interface Context {
    readonly repositories: {
        readonly accounts: AccountRepository;
    }
}

export class ChangePassword extends Command<void, Context, Args> {
    public readonly isPrivate = true;
    public readonly description = "Changes the account password."
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.NumberProperty("account", "Where to change the password."),
        new Foundation.StringProperty("publickkey_old", "Of current password."),
        new Foundation.StringProperty("publickkey_new", "Of new password.")
    );

    public async execute(args: Args): Promise<Response> {
        const account = await this.context.repositories.accounts.getByID(args.account);

        if (account.key != args.publickey_old)
            throw new Foundation.ForbiddenError('#_wrong_public_key');

        await this.context.repositories.accounts.changePassword(args.account, args.publickey_new);

        return new OKResponse();
    }
}