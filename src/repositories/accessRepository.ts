import { Access } from "../models/access";
import { Repository } from "../utils/repository";

export class AccessRepository extends Repository<any> {
    public async hasAccess(api: string): Promise<boolean> {
        const result = await this.database.query(`SELECT UNIX_TIMESTAMP(\`expiration\`) FROM ${this.config.table} WHERE \`api\`=?`, [api]);

        if (!result.length)
            return false;

        const now = Date.now();
        const expiration = result[0].expiration * 1000;

        if (expiration <= now)
            return false;

        return true;
    }

    public async getByAPI(api: string): Promise<Access | null> {
        const result = await this.database.query(`SELECT *, UNIX_TIMESTAMP(\`created\`) as \`created\`, UNIX_TIMESTAMP(\`expiration\`) as \`expiration\` FROM ${this.config.table} WHERE \`api\`=? LIMIT 1`, [api]);

        if (!result.length)
            return null;

        return {
            id: result[0].id,
            created: result[0].created * 1000,
            expiration: result[0].expiration * 1000,
            account: result[0].account,
            api: result[0].api,
            secret: result[0].secret,
            label: result[0].label
        };
    }

    public async create(
        created: number,
        account: number,
        api: string,
        secret: string,
        label: string,
        expiration?: number
    ): Promise<number> {
        const keys = ['`created`', '`account`', '`api`', '`secret`', '`label`'];
        const values = ['FROM_UNIXTIME(?)', '?', '?', '?', '?'];

        const args = [
            created / 1000,
            account,
            api,
            secret,
            label
        ];

        if (expiration) {
            keys.push('`expiration`');
            values.push('FROM_UNIXTIME(?)');
            args.push(expiration / 1000);
        }

        const result = await this.database.query(`INSERT INTO ${this.config.table} (${keys.join(',')}) VALUES (${values.join(',')})`, args);

        return result.insertId;
    }

    public async delete(id: number): Promise<void> {
        await this.database.query(`DELETE FROM ${this.config.table} WHERE \`id\`=?`, [id]);
    }
}