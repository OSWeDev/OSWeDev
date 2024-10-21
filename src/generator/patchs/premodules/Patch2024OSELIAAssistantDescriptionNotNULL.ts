/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch2024OSELIAAssistantDescriptionNotNULL implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch2024OSELIAAssistantDescriptionNotNULL {
        if (!Patch2024OSELIAAssistantDescriptionNotNULL.instance) {
            Patch2024OSELIAAssistantDescriptionNotNULL.instance = new Patch2024OSELIAAssistantDescriptionNotNULL();
        }
        return Patch2024OSELIAAssistantDescriptionNotNULL.instance;
    }

    private static instance: Patch2024OSELIAAssistantDescriptionNotNULL = null;

    get uid(): string {
        return 'Patch2024OSELIAAssistantDescriptionNotNULL';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.query("update ref.module_gpt_gpt_assistant_assistant set description = nom where description is null;");
            await db.query("update versioned.module_gpt_gpt_assistant_assistant set description = nom where description is null;");
            await db.query("update trashed__versioned.module_gpt_gpt_assistant_assistant set description = nom where description is null;");
            await db.query("update trashed.module_gpt_gpt_assistant_assistant set description = nom where description is null;");

            await db.query("update ref.module_gpt_gpt_assistant_assistant set instructions = nom where instructions is null;");
            await db.query("update versioned.module_gpt_gpt_assistant_assistant set instructions = nom where instructions is null;");
            await db.query("update trashed__versioned.module_gpt_gpt_assistant_assistant set instructions = nom where instructions is null;");
            await db.query("update trashed.module_gpt_gpt_assistant_assistant set instructions = nom where instructions is null;");

        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}