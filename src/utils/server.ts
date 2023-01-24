import * as fs from "fs";
import * as https from "https";
import * as http from "http";
import * as Foundation from "foundationjs";
import { Command } from "./command";
import { AccessRepository } from "../repositories/accessRepository";
import { Access } from "../models/access";

const DEFAULT_HOST = 'localhost';
const DEFAULT_TIMEOUT = 5000;
const DEFAULT_TIME_WINDOW = 10000;
const DEFAULT_PORT_HTTP = 80;
const DEFAULT_PORT_HTTPS = 443;

enum Protocol {
    HTTP = 'http',
    HTTPS = 'https'
}

export interface ServerConfig {
    readonly protocol: Protocol;
    readonly key?: string;
    readonly cert?: string;
    readonly host?: number;
    readonly port?: number;
    readonly timeout?: number;
    readonly timeWindow?: number;
    readonly headers: http.OutgoingHttpHeaders;
}

export class Server extends Foundation.Commander {
    public readonly onMessage = new Foundation.Event<Server, string>();
    public readonly onError = new Foundation.Event<Server, Error>();

    private readonly _servers: http.Server[] = [];

    constructor(public readonly access: AccessRepository) {
        super();
    }

    public addCommand(command: string, singleton: Foundation.Singleton<Command<any, any>>) {
        super.addCommand(command, singleton);
    }

    public addCommands(commands: NodeJS.ReadOnlyDict<Foundation.Singleton<Command<any, any>>>) {
        super.addCommands(commands);
    }

    public start(...configs: readonly ServerConfig[]) {
        configs.forEach(config => {
            const isHTTPS = config.protocol == Protocol.HTTPS;
            const allowedOrigins = config.headers[Foundation.ResponseHeader.AllowOrigin]
                ? (config.headers[Foundation.ResponseHeader.AllowOrigin] as string).split(',')
                : ['*'];

            config.headers[Foundation.ResponseHeader.AllowHeaders] = Object.values(Foundation.RequestHeader).join(",");

            const server = isHTTPS ? https.createServer({
                key: fs.readFileSync(config.key),
                cert: fs.readFileSync(config.cert)
            }, (request, response) => this.onRequest(request, response, Protocol.HTTPS, Object.assign({}, config.headers), allowedOrigins, {
                timeWindow: config.timeWindow || DEFAULT_TIME_WINDOW
            })) : http.createServer((request, response) => this.onRequest(request, response, Protocol.HTTP, Object.assign({}, config.headers), allowedOrigins, {
                timeWindow: config.timeWindow || DEFAULT_TIME_WINDOW
            }));

            server.setTimeout(config.timeout || DEFAULT_TIMEOUT);
            server.keepAliveTimeout = config.timeout || DEFAULT_TIMEOUT;

            server.listen({
                port: config.port || (isHTTPS && DEFAULT_PORT_HTTPS) || DEFAULT_PORT_HTTP,
                host: config.host || DEFAULT_HOST
            });

            this._servers.push(server);
            this.onMessage.emit(this, `start ${config.protocol} ${Object.keys(config).map(key => `--${key} ${config[key]}`).join(' ')}`);
        });
    }

    public stop() {
        this._servers.forEach(server => server.close());
        this._servers.splice(0, this._servers.length);

        this.onMessage.emit(this, "stop");
    }

    private async onRequest(
        request: http.IncomingMessage,
        response: http.ServerResponse,
        protocol: Protocol,
        responseHeaders: http.OutgoingHttpHeaders,
        allowedOrigins: readonly string[],
        config: { readonly timeWindow: number }
    ) {
        // todo: catch allowed methods
        // todo: catch allowed headers
        // todo: catch max age

        responseHeaders[Foundation.ResponseHeader.ContentType] = Foundation.ResponseType.Text;

        if (!allowedOrigins.includes(request.headers.origin) && !allowedOrigins.includes('*')) {
            response.writeHead(Foundation.ResponseCode.Forbidden, responseHeaders);
            response.end();
            return;
        }

        if (request.headers.origin)
            responseHeaders[Foundation.ResponseHeader.AllowOrigin] = request.headers.origin;

        if (Foundation.RequestMethod.Option == request.method) {
            response.writeHead(Foundation.ResponseCode.NoContent, responseHeaders);
            response.end();
            return;
        }

        const time = Date.now();
        const ip = request.socket.remoteAddress;
        const url = new URL(request.url, protocol + '://' + request.headers.host + '/');

        const command = url.pathname
            .substring(1)
            .toLowerCase();

        const query = url.search
            .substring(1);

        const args: any = {};

        url.searchParams.forEach((value, key) => args[key]
            ? Array.isArray(args[key])
                ? args[key].push(value)
                : args[key] = [args[key], value]
            : args[key] = value
        );

        // delete account from url args
        // for securty reasons
        delete args.account;

        this.onMessage.emit(this, `'${ip}' requested '${request.url}'`);

        try {
            const instance = this.getCommand<Command<any, any>>(command);

            if (!instance)
                throw new Foundation.BadRequestError(Foundation.ErrorMessage.InvalidRoute);

            if (args.timestamp)
                if (!Server.validateTimestamp(Number(args.timestamp), time, config.timeWindow))
                    throw new Foundation.ForbiddenError(Foundation.ErrorMessage.InvalidTimestamp);

            if (instance.isPrivate) {
                const api = Foundation.parseToString(request.headers[Foundation.RequestHeader.APIKey], Foundation.RequestHeader.APIKey);
                const signature = Foundation.parseToString(request.headers[Foundation.RequestHeader.Signature], Foundation.RequestHeader.Signature);

                const access = await this.access.getByAPI(api);

                if (!Server.validateAccess(access, time))
                    throw new Foundation.UnauthorizedError(Foundation.ErrorMessage.InvalidAPIKey);

                if (!Server.validateSignature(signature, query, access.secret))
                    throw new Foundation.UnauthorizedError(Foundation.ErrorMessage.InvalidSignature);

                // set account to command args always
                // for securty reasons
                args.account = access.account;
            }

            const result = await instance.execute(args);

            responseHeaders[Foundation.ResponseHeader.ContentType] = result.type;

            response.writeHead(result.code, responseHeaders);
            response.end(result.data);
        } catch (error) {
            response.writeHead(error.code || Foundation.ResponseCode.InternalServerError, responseHeaders);
            response.end(error.code ? error.message : 'something_went_wrong');

            this.onError.emit(this, error);
        }
    }

    public static validateTimestamp(timestamp: number, time: number, timewindow: number): boolean {
        if (!timestamp)
            return false;

        if (isNaN(timestamp))
            return false;

        if (timestamp > time + timewindow)
            return false;

        if (timestamp < time - timewindow)
            return false;

        return true;
    }

    public static validateAccess(access: Access, time: number): boolean {
        if (!access)
            return false;

        if (access.expiration && access.expiration < time)
            return false;

        return true;
    }

    public static validateSignature(signature: string, query: string, secret: string): boolean {
        if (!signature)
            return false;

        if (isNaN(query as any) && !query.includes('timestamp='))
            return false;

        if (signature !== Foundation.createSign(query, secret))
            return false;

        return true;
    }
}