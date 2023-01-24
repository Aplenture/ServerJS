import { ResponseCode, ResponseType } from "foundationjs";
import { Response } from "../utils";

export class JSONResponse extends Response {
    constructor(data: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number) {
        super(JSON.stringify(data, replacer, space), ResponseType.JSON, ResponseCode.OK);
    }
}