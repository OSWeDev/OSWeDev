/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210727VarsCacheMSToSEC implements IGeneratorWorker {

    public static getInstance(): Patch20210727VarsCacheMSToSEC {
        if (!Patch20210727VarsCacheMSToSEC.instance) {
            Patch20210727VarsCacheMSToSEC.instance = new Patch20210727VarsCacheMSToSEC();
        }
        return Patch20210727VarsCacheMSToSEC.instance;
    }

    private static instance: Patch20210727VarsCacheMSToSEC = null;

    get uid(): string {
        return 'Patch20210727VarsCacheMSToSEC';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let caches: VarCacheConfVO[] = await ModuleDAO.getInstance().getVos<VarCacheConfVO>(VarCacheConfVO.API_TYPE_ID);
        for (let i in caches) {
            let cache = caches[i];

            if (cache && (cache.cache_timeout_secs > 0)) {
                cache.cache_timeout_secs = Math.round(cache.cache_timeout_secs / 1000);
                await ModuleDAO.getInstance().insertOrUpdateVO(cache);
            }
        }
    }
}