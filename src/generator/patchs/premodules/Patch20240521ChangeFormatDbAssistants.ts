/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240521ChangeFormatDbAssistants implements IGeneratorWorker {


    private static instance: Patch20240521ChangeFormatDbAssistants = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240521ChangeFormatDbAssistants';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240521ChangeFormatDbAssistants {
        if (!Patch20240521ChangeFormatDbAssistants.instance) {
            Patch20240521ChangeFormatDbAssistants.instance = new Patch20240521ChangeFormatDbAssistants();
        }
        return Patch20240521ChangeFormatDbAssistants.instance;
    }

    public async work(db: IDatabase<any>) {
        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content RENAME COLUMN content_type TO type;');
        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content RENAME COLUMN email_id TO content_type_email_id;');
        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content RENAME COLUMN action_url_id TO content_type_action_url_id;');
        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content RENAME COLUMN value TO content_type_text;');

        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg RENAME COLUMN gpt_message_id TO gpt_id;');
        await db.query('ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg RENAME COLUMN role_type TO role;');

        await db.query("ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content ADD COLUMN temp_jsonb_content jsonb;");
        await db.query("UPDATE ref.module_gpt_gpt_assistant_thread_msg_content SET temp_jsonb_content = jsonb_build_object('_type', 'gpt_assistant_thread_msg_content_text', 'value', content_type_text);");
        await db.query("UPDATE ref.module_gpt_gpt_assistant_thread_msg_content SET content_type_text = temp_jsonb_content::text;");
        await db.query("ALTER TABLE ref.module_gpt_gpt_assistant_thread_msg_content DROP COLUMN temp_jsonb_content;");

    }
}