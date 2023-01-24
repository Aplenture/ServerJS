import { Repository } from "../utils/repository";
import { Account } from "../models/account";

export class AccountRepository extends Repository<any> {
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
}