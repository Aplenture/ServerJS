import * as MySQL from "mariadb";
import * as fs from "fs";
import * as Foundation from "foundationjs";

type Type = string | number
type Entry = NodeJS.ReadOnlyDict<any>;

export interface DatabaseConfig {
    readonly host: string;
    readonly user: string;
    readonly password: string;
    readonly database: string;
}

export class Database {
    public static readonly onMessage = new Foundation.Event<Database, string>();

    private pool: MySQL.Pool;

    constructor(
        public readonly name: string,
        private readonly config: DatabaseConfig
    ) { }

    public static async create(config: DatabaseConfig): Promise<void> {
        const connection = await MySQL.createConnection({
            host: config.host,
            user: config.user,
            password: config.password
        });

        return connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`)
            .then(() => connection.end())
            .catch(() => connection.end());
    }

    public static async drop(config: DatabaseConfig): Promise<void> {
        const connection = await MySQL.createConnection({
            host: config.host,
            user: config.user,
            password: config.password
        });

        return connection.query(`DROP DATABASE IF EXISTS ${config.database}`)
            .then(() => connection.end())
            .catch(() => connection.end());
    }

    public static async reset(config: DatabaseConfig): Promise<void> {
        await this.drop(config);
        await this.create(config);
    }

    public async init(): Promise<void> {
        if (this.pool)
            throw new Error(`Database is already initialized`);

        this.pool = await MySQL.createPool(this.config);
    }

    public async close(): Promise<void> {
        if (!this.pool)
            throw new Error(`Database is not initialized.`);

        await this.pool.end();

        this.pool = null;
    }

    public async update(directory: string): Promise<void> {
        await this.query(`CREATE TABLE IF NOT EXISTS \`updates\` (
            \`id\` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            \`time\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`path\` TEXT NOT NULL
            ) DEFAULT CHARSET=utf8`);

        const folders = fs.readdirSync(directory, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .sort((a, b) => {
                if (a < b) return -1;
                if (a > b) return 1;

                return 0;
            });

        for (let i = 0; i < folders.length; ++i) {
            const folder = folders[i];
            const files = fs.readdirSync(`${directory}/${folder}`);

            for (let j = 0; j < files.length; ++j) {
                const file = files[j];
                const update = `${folder}/${file}`;
                const path = `${directory}/${update}`;
                const query = fs
                    .readFileSync(path)
                    .toString();

                const executedUpdates = await this.query(`SELECT * FROM \`updates\` WHERE \`path\`=?`, [update]);

                if (executedUpdates.length) {
                    Database.onMessage.emit(this, `skip update '${update}' (already executed)`);
                    continue;
                }

                Database.onMessage.emit(this, `execute update '${update}'`);

                await this.query(query);
                await this.query(`INSERT INTO \`updates\` (\`path\`) VALUES (?)`, [update]);
            }
        }
    }

    public async query(query: string, values: readonly Type[] = []): Promise<any> {
        const stopwatch = new Foundation.Stopwatch();

        query = Database.escapeQuery(query, values);

        Database.onMessage.emit(this, `${this.name}.db << ${query}`);

        const connection = await this.pool.getConnection();

        stopwatch.start();

        const result = await connection.query({
            sql: query,
            insertIdAsNumber: true,
            checkDuplicate: false,
            decimalAsNumber: true,
            bigIntAsNumber: true
        });

        stopwatch.stop();
        connection.release();

        delete result.meta;

        if (Array.isArray(result))
            result.forEach(entry => Database.decodeEntry(entry));

        Database.onMessage.emit(this, `${this.name}.db >> ${query} >> ${Foundation.formatDuration(stopwatch.duration, {
            seconds: true,
            milliseconds: true
        })}`);

        return result;
    }

    public fetch(query: string, callback: (result: Entry, index: number) => Promise<any>, values: readonly Type[] = []): Promise<void> {
        query = Database.escapeQuery(query, values);

        let index = 0;

        Database.onMessage.emit(this, "database << " + query);

        return new Promise<void>(async (resolve, reject) => {
            const connection = await this.pool.getConnection();
            const stream = connection.queryStream({
                sql: query,
                insertIdAsNumber: true,
                checkDuplicate: false,
                decimalAsNumber: true,
                bigIntAsNumber: true
            });

            stream.on("error", error => {
                connection.release();
                reject(error);
            });

            stream.on("end", () => {
                connection.release();
                resolve();
            });

            stream.on("data", async entry => {
                try {
                    stream.pause();

                    Database.decodeEntry(entry);

                    await callback(entry as any, index++);

                    stream.resume();
                } catch (error) {
                    stream.destroy(error);
                }
            });
        });
    }

    private static escapeQuery(query: string, values: readonly Type[]): string {
        let result = query;

        values.forEach(value => result = result.replace('?', typeof value === 'string' ? "'" + Foundation.encodeString(value) + "'" : value.toString()))

        return result;
    }

    private static decodeEntry(entry: Entry): void {
        Object.keys(entry).forEach(key => (entry[key] as any) = typeof entry[key] === 'string' ? Foundation.decodeString(entry[key] as string) : entry[key]);
    }
}