import { IDatabase } from 'pg-promise';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class Patch20220401SetParamPushData implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20220401SetParamPushData {
        if (!Patch20220401SetParamPushData.instance) {
            Patch20220401SetParamPushData.instance = new Patch20220401SetParamPushData();
        }
        return Patch20220401SetParamPushData.instance;
    }

    private static instance: Patch20220401SetParamPushData = null;

    get uid(): string {
        return 'Patch20220401SetParamPushData';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValue(ModulePushData.PARAM_TECH_DISCONNECT_URL, '/login');
    }
}