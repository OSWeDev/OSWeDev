/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import VarsDatasVoUpdateHandler from '../../../server/modules/Var/VarsDatasVoUpdateHandler';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20221217ParamBlockVos implements IGeneratorWorker {

    public static getInstance(): Patch20221217ParamBlockVos {
        if (!Patch20221217ParamBlockVos.instance) {
            Patch20221217ParamBlockVos.instance = new Patch20221217ParamBlockVos();
        }
        return Patch20221217ParamBlockVos.instance;
    }

    private static instance: Patch20221217ParamBlockVos = null;

    get uid(): string {
        return 'Patch20221217ParamBlockVos';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValueAsBoolean(VarsDatasVoUpdateHandler.VarsDatasVoUpdateHandler_block_ordered_vos_cud_PARAM_NAME, false);
    }
}