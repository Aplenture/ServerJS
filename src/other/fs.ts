export function createInstance<T>(path: string, className: string, ...args: any[]): T {
    return new (require(`${process.env.PWD}/${path}.js`))[className](...args) as T;
}