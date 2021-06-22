export default interface IServerUserSession {
    uid: number;
    sid: string;
    returning: boolean;
    impersonated_from: IServerUserSession;

    // Pour une raison obscure les Moment semblent pas marcher, peut-être lié au fichier des sessions ?
    creation_date_unix: number;
    last_load_date_unix: number;
    last_check_blocked_or_expired: number;

    // From Express.Session :
    cookie: any;
    id: string;
    regenerate(callback: (err: any) => void): void;
    destroy(callback: (err: any) => void): void;
    reload(callback: (err: any) => void): void;
    save(callback: (err: any) => void): void;
    touch(): void;
}