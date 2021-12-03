/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleVarServer from '../../../server/modules/Var/ModuleVarServer';
import SlowVarVO from '../../../shared/modules/Var/vos/SlowVarVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20211203ClearVarCaches implements IGeneratorWorker {

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

        await ModuleVarServer.getInstance().delete_all_cache();
        await ModuleDAOServer.getInstance().truncate(SlowVarVO.API_TYPE_ID);
    }
}