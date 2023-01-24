import { ResponseCode, ResponseType } from "foundationjs";
import { Response } from "../utils";

export class TextResponse extends Response {
    constructor(text: string, code = ResponseCode.OK) {
        super(text, ResponseType.Text, code);
    }
}