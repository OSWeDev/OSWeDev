import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250507InitLastOseliaRunID implements IGeneratorWorker {

    private static instance: Patch20250507InitLastOseliaRunID = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250507InitLastOseliaRunID';
    }

    public static getInstance(): Patch20250507InitLastOseliaRunID {
        if (!Patch20250507InitLastOseliaRunID.instance) {
            Patch20250507InitLastOseliaRunID.instance = new Patch20250507InitLastOseliaRunID();
        }
        return Patch20250507InitLastOseliaRunID.instance;
    }

    public async work(db: IDatabase<unknown>) {
        try {

            await db.query("UPDATE ref.module_gpt_gpt_assistant_thread t SET last_oselia_run_id = u.id FROM ref.module_oselia_oselia_run u WHERE t.id = u.thread_id;");
        } catch (error) {
            //
        }
    }
}