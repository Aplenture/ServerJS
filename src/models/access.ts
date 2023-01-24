export interface Access {
    readonly id: number;
    readonly created: number;
    readonly account: number;
    readonly api: string;
    readonly secret: string;
    readonly expiration?: number;
    readonly label?: string;
}