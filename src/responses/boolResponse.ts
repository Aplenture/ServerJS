import { TextResponse } from "./textResponse";

export class BoolResponse extends TextResponse {
    constructor(value: boolean) {
        super(value ? "1" : "0");
    }
}