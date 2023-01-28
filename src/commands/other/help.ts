import * as Foundation from "foundationjs";
import { TextResponse } from "../../responses";
import { Response } from "../../utils";
import { AppConfig } from "../../models";

interface Context {
    readonly commands: NodeJS.ReadOnlyDict<Foundation.Singleton<Foundation.Command<any, any, any, any>>>;
}

export class Help extends Foundation.Command<AppConfig, Context, any, Response> {
    public description = "Returna the API description.";
    public property = null;

    public async execute(): Promise<Response> {
        const commands = Object.keys(this.context.commands)
            .sort((a, b) => a.localeCompare(b));

        const maxCommandNameLength = Math.max(...commands.map(command => command.length));

        let result = `${this.config.name} v${this.config.version} by ${this.config.author}\n`;

        result += '\n';
        result += this.config.description + '\n';
        result += '\n';
        result += 'Commands:\n';
        result += commands
            .map(command => `  ${command}${' '.repeat(maxCommandNameLength - command.length)} - ${this.context.commands[command].instance.description}`)
            .join('\n');

        return new TextResponse(result);
    }
}