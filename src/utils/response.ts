import { ResponseCode, ResponseType } from "foundationjs";

export class Response {
    constructor(
        public readonly data: string,
        public readonly type: ResponseType,
        public readonly code: ResponseCode
    ) { }
}