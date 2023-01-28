import * as fs from "fs";
import * as Foundation from "foundationjs";
import { TextResponse } from "../../responses";
import { Response } from "../../utils";

interface Context {
    readonly commands: NodeJS.ReadOnlyDict<Foundation.Singleton<Foundation.Command<any, any, any, any>>>;
}

export class Help extends Foundation.Command<void, Context, any, Response> {
    public description = "Returna the API description.";
    public property = null;

    public async execute(): Promise<Response> {
        const app = JSON.parse(fs.readFileSync(`${process.env.PWD}/package.json`).toString());

        const commands = Object.keys(this.context.commands)
            .sort((a, b) => a.localeCompare(b));

        const maxCommandNameLength = Math.max(...commands.map(command => command.length));

        let result = `${app.name} v${app.version} by ${app.author}\n`;

        result += '\n';
        result += app.description + '\n';
        result += '\n';
        result += 'Commands:\n';
        result += commands
            .map(command => `  ${command}${' '.repeat(maxCommandNameLength - command.length)} - ${this.context.commands[command].instance.description}`)
            .join('\n');

        return new TextResponse(result);
    }
}