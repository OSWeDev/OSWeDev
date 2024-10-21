/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240827DeleteVersionedAssistantsWithoutInstructions implements IGeneratorWorker {


    private static instance: Patch20240827DeleteVersionedAssistantsWithoutInstructions = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240827DeleteVersionedAssistantsWithoutInstructions';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240827DeleteVersionedAssistantsWithoutInstructions {
        if (!Patch20240827DeleteVersionedAssistantsWithoutInstructions.instance) {
            Patch20240827DeleteVersionedAssistantsWithoutInstructions.instance = new Patch20240827DeleteVersionedAssistantsWithoutInstructions();
        }
        return Patch20240827DeleteVersionedAssistantsWithoutInstructions.instance;
    }

    public async work(db: IDatabase<any>) {
        try {

            await db.query('DELETE FROM versioned.module_gpt_gpt_assistant_assistant where instructions is null;');
            await db.query('DELETE FROM trashed.module_gpt_gpt_assistant_assistant where instructions is null;');
            await db.query('DELETE FROM trashed__versioned.module_gpt_gpt_assistant_assistant where instructions is null;');
        } catch (error) {
            ConsoleHandler.warn('Pas grave si nouveau projet');
        }
    }
}