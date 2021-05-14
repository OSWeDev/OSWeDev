/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20201123UpdateVarCacheConfVO implements IGeneratorWorker {

    public static getInstance(): Patch20201123UpdateVarCacheConfVO {
        if (!Patch20201123UpdateVarCacheConfVO.instance) {
            Patch20201123UpdateVarCacheConfVO.instance = new Patch20201123UpdateVarCacheConfVO();
        }
        return Patch20201123UpdateVarCacheConfVO.instance;
    }

    private static instance: Patch20201123UpdateVarCacheConfVO = null;

    get uid(): string {
        return 'Patch20201123UpdateVarCacheConfVO';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            await db.none("update ref.module_var_var_cache_conf set cache_timeout_ms = 0 where cache_timeout_ms is null;");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}