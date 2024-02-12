/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import VarsServerController from '../../../server/modules/Var/VarsServerController';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220713ChangeVarCacheType1To0 implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
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
    }
}