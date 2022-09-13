/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220713ChangeVarCacheType1To0 implements IGeneratorWorker {

    public static getInstance(): Patch20220713ChangeVarCacheType1To0 {
        if (!Patch20220713ChangeVarCacheType1To0.instance) {
            Patch20220713ChangeVarCacheType1To0.instance = new Patch20220713ChangeVarCacheType1To0();
        }
        return Patch20220713ChangeVarCacheType1To0.instance;
    }

    private static instance: Patch20220713ChangeVarCacheType1To0 = null;

    get uid(): string {
        return 'Patch20220713ChangeVarCacheType1To0';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        for (let i in VarsServerController.getInstance().varcacheconf_by_var_ids) {
            let varcacheconf = VarsServerController.getInstance().varcacheconf_by_var_ids[i];

            if (varcacheconf.cache_startegy == VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_NONE) {
                varcacheconf.cache_startegy = VarCacheConfVO.VALUE_CACHE_STRATEGY_CACHE_ALL_NEVER_LOAD_CHUNKS;
                await ModuleDAO.getInstance().insertOrUpdateVO(varcacheconf);
            }
        }
    }
}