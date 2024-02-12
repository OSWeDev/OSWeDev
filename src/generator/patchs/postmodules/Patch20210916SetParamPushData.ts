import { IDatabase } from 'pg-promise';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModulePushData from '../../../shared/modules/PushData/ModulePushData';
import IGeneratorWorker from '../../IGeneratorWorker';


export default class Patch20210916SetParamPushData implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20210916SetParamPushData {
        if (!Patch20210916SetParamPushData.instance) {
            Patch20210916SetParamPushData.instance = new Patch20210916SetParamPushData();
        }
        return Patch20210916SetParamPushData.instance;
    }

    private static instance: Patch20210916SetParamPushData = null;

    get uid(): string {
        return 'Patch20210916SetParamPushData';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await ModuleParams.getInstance().setParamValue_if_not_exists(ModulePushData.PARAM_TECH_DISCONNECT_URL, '/');
    }
}