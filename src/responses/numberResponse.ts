import { TextResponse } from "./textResponse";

export class NumberResponse extends TextResponse {
    constructor(value: number) {
        super(value.toString());
    }
}