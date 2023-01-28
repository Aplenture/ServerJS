import { RepositoryConfig } from "../models";
import { Database } from "./database";

export abstract class Repository<TConfig extends RepositoryConfig> {
    constructor(
        protected readonly database: Database,
        protected readonly config: TConfig
    ) { }
}