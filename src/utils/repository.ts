import { Database } from "./database";

export interface RepositoryConfig {
    readonly table: string;
}

export abstract class Repository<TConfig extends RepositoryConfig> {
    constructor(
        protected readonly database: Database,
        protected readonly config: TConfig
    ) { }
}