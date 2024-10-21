import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240906DeleteOldAssistantObjDBLinks implements IGeneratorWorker {

    private static instance: Patch20240906DeleteOldAssistantObjDBLinks = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20240906DeleteOldAssistantObjDBLinks';
    }

    public static getInstance(): Patch20240906DeleteOldAssistantObjDBLinks {
        if (!Patch20240906DeleteOldAssistantObjDBLinks.instance) {
            Patch20240906DeleteOldAssistantObjDBLinks.instance = new Patch20240906DeleteOldAssistantObjDBLinks();
        }
        return Patch20240906DeleteOldAssistantObjDBLinks.instance;
    }

    public async work(db: IDatabase<unknown>) {

        try {

            await db.query("DELETE FROM ref.module_dashboardbuilder_dashboard_graphvoref where vo_type = 'gpt_assistant_thread_message_file';");
            // eslint-disable-next-line no-empty
        } catch (error) { }
    }
}