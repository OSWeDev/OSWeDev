import { IDatabase } from "pg-promise";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20241119DeleteSessions implements IGeneratorWorker {

    private static instance: Patch20241119DeleteSessions = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241119DeleteSessions';
    }

    public static getInstance(): Patch20241119DeleteSessions {
        if (!Patch20241119DeleteSessions.instance) {
            Patch20241119DeleteSessions.instance = new Patch20241119DeleteSessions();
        }
        return Patch20241119DeleteSessions.instance;
    }

    public async work(db: IDatabase<unknown>) {
        db.query("drop table ref.module_expressdbsessions_express_session;");
    }
}