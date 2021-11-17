/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleVarServer from '../../../server/modules/Var/ModuleVarServer';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20211117ChangeVarDataIndex implements IGeneratorWorker {

    public static getInstance(): Patch20211117ChangeVarDataIndex {
        if (!Patch20211117ChangeVarDataIndex.instance) {
            Patch20211117ChangeVarDataIndex.instance = new Patch20211117ChangeVarDataIndex();
        }
        return Patch20211117ChangeVarDataIndex.instance;
    }

    private static instance: Patch20211117ChangeVarDataIndex = null;

    get uid(): string {
        return 'Patch20211117ChangeVarDataIndex';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        /**
         * On commence par vider le cache des vars - pas des imports
         */
        await ModuleVarServer.getInstance().delete_all_cache();

        /**
         * Pour tous les types de vars
         */
        for (let api_type_id in VarsServerController.getInstance().registered_vars_controller_by_api_type_id) {

            let vos = await ModuleDAO.getInstance().getVos(api_type_id);
            await ModuleDAO.getInstance().insertOrUpdateVOs(vos);
        }
    }
}