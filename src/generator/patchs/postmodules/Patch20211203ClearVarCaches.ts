/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20211203ClearVarCaches implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20211203ClearVarCaches {
        if (!Patch20211203ClearVarCaches.instance) {
            Patch20211203ClearVarCaches.instance = new Patch20211203ClearVarCaches();
        }
        return Patch20211203ClearVarCaches.instance;
    }

    private static instance: Patch20211203ClearVarCaches = null;

    get uid(): string {
        return 'Patch20211203ClearVarCaches';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        // await ModuleVarServer.getInstance().delete_all_cache();
        // await ModuleDAOServer.instance.truncate(SlowVarVO.API_TYPE_ID);
    }
}