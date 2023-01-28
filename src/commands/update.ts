import * as Foundation from "foundationjs";
import { Database, DatabaseConfig } from "../utils";

interface Config {
    readonly databases: readonly DatabaseConfig[];
}

interface Args {
    readonly directory: string;
}

export class Update extends Foundation.Command<Config, void, Args, string> {
    public readonly description = "Updates the databases.";
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.StringProperty("directory", "Directory of update files.")
    );

    public async execute(args: Args): Promise<string> {
        const databaseMessageCallback = message => this.message(message);

        Database.onMessage.on(databaseMessageCallback);

        for (const name in this.config.databases) {
            const database = new Database(name, this.config.databases[name]);
            const directory = `${process.env.PWD}/${args.directory}/${name}`;

            this.message(`update database '${name}'`);

            await database.init();
            await database.update(directory);
            await database.close();
        }

        Database.onMessage.off(databaseMessageCallback);

        return "databases updated";
    }
}