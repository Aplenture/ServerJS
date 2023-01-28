import { Repository } from "../utils/repository";
import { Account } from "../models/account";

export class AccountRepository extends Repository<any> {
    public async getByID(id: number): Promise<Account | null> {
        const result = await this.database.query(`SELECT *, FROM_UNIXTIME(\`created\`) as \`created\` FROM ${this.config.table} WHERE \`id\`=? LIMIT 1`, [
            id
        ]);

        if (!result.length)
            return null;

        return {
            id: result[0].id,
            created: result[0].created / 1000,
            username: result[0].username,
            key: result[0].key
        };
    }

    public async getByName(username: string): Promise<Account | null> {
        const result = await this.database.query(`SELECT *, FROM_UNIXTIME(\`created\`) as \`created\` FROM ${this.config.table} WHERE \`username\`=? LIMIT 1`, [
            username
        ]);

        if (!result.length)
            return null;

        return {
            id: result[0].id,
            created: result[0].created / 1000,
            username: result[0].username,
            key: result[0].key
        };
    }

    public async create(username: string, key: string): Promise<Account | null> {
        const created = Date.now();
        const result = await this.database.query(`INSERT INTO ${this.config.table} (\`username\`,\`key\`,\`created\`) VALUES (?,?,FROM_UNIXTIME(?))`, [
            username,
            key,
            created / 1000
        ]);

        return {
            id: result.insertId,
            created,
            username,
            key
        };
    }

    public async changePassword(account: number, key: string): Promise<void> {
        await this.database.query(`UPDATE ${this.config.table} SET \`key\`=? WHERE \`id\`=?`, [
            key,
            account
        ]);
    }
}