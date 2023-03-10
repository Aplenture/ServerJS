import * as Foundation from "foundationjs";
import { DatabaseConfig } from "../../models";
import { Database } from "../../utils";

interface Config {
    readonly databases: readonly DatabaseConfig[];
}

interface Args {
    readonly directory: string;
}

export class ResetDatabase extends Foundation.Command<Config, void, Args, string> {
    public readonly description = "Resets the databases.";
    public readonly property = new Foundation.DictionaryProperty<Args>("",
        new Foundation.StringProperty("directory", "Directory of update files.")
    );

    public async execute(args: Args): Promise<string> {
        const databaseMessageCallback = message => this.message(message);

        Database.onMessage.on(databaseMessageCallback);

        for (const name in this.config.databases) {
            const config = this.config.databases[name];
            const database = new Database(name, config);
            const directory = `${process.env.PWD}/${args.directory}/${name}`;

            this.message(`drop database '${name}'`);
            await Database.drop(config);

            this.message(`create database '${name}'`);
            await Database.create(config);

            this.message(`update database '${name}'`);
            await database.init();
            await database.update(directory);
            await database.close();
        }

        Database.onMessage.off(databaseMessageCallback);

        return "databases reset";
    }
}