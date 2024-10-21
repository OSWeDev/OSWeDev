import { IDatabase } from "pg-promise";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20240524InitExistingGPTMessageThreadAndRunGPTIds implements IGeneratorWorker {

    private static instance: Patch20240524InitExistingGPTMessageThreadAndRunGPTIds = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240524InitExistingGPTMessageThreadAndRunGPTIds';
    }

    public static getInstance(): Patch20240524InitExistingGPTMessageThreadAndRunGPTIds {
        if (!Patch20240524InitExistingGPTMessageThreadAndRunGPTIds.instance) {
            Patch20240524InitExistingGPTMessageThreadAndRunGPTIds.instance = new Patch20240524InitExistingGPTMessageThreadAndRunGPTIds();
        }
        return Patch20240524InitExistingGPTMessageThreadAndRunGPTIds.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // "-- Mise à jour de messages avec les identifiants de thread correspondants " +
        await db.query("UPDATE ref.module_gpt_gpt_assistant_thread_msg " +
            "SET gpt_thread_id = t.gpt_thread_id " +
            "FROM ( " +
            "SELECT m.id, t.gpt_thread_id " +
            "FROM ref.module_gpt_gpt_assistant_thread_msg m " +
            "JOIN ref.module_gpt_gpt_assistant_thread t ON m.thread_id = t.id " +
            "WHERE m.thread_id IS NOT NULL " +
            ") AS t " +
            "WHERE ref.module_gpt_gpt_assistant_thread_msg.id = t.id;");

        // "-- Mise à jour de messages avec les identifiants de run correspondants " +
        await db.query("UPDATE ref.module_gpt_gpt_assistant_thread_msg " +
            "SET gpt_run_id = r.gpt_run_id " +
            "FROM ( " +
            "SELECT m.id, r.gpt_run_id " +
            "FROM ref.module_gpt_gpt_assistant_thread_msg m " +
            "JOIN ref.module_gpt_gpt_assistant_run r ON m.run_id = r.id " +
            "WHERE m.run_id IS NOT NULL " +
            ") AS r " +
            "WHERE ref.module_gpt_gpt_assistant_thread_msg.id = r.id;");

        // "-- Mise à jour de messages avec les identifiants d'assistant correspondants " +
        await db.query("UPDATE ref.module_gpt_gpt_assistant_thread_msg " +
            "SET gpt_assistant_id = a.gpt_assistant_id " +
            "FROM ( " +
            "SELECT m.id, a.gpt_assistant_id " +
            "FROM ref.module_gpt_gpt_assistant_thread_msg m " +
            "JOIN ref.module_gpt_gpt_assistant_assistant a ON m.assistant_id = a.id " +
            "WHERE m.assistant_id IS NOT NULL " +
            ") AS a " +
            "WHERE ref.module_gpt_gpt_assistant_thread_msg.id = a.id;");
    }
}