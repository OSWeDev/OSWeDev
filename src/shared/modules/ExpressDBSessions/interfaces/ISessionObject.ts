export default interface ISessionObject {
    cookie: { maxAge?: number, expire?: number, [property: string]: any };
    [property: string]: any;
}
