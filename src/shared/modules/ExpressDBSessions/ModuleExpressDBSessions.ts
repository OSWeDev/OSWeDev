import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import ExpressSessionVO from './vos/ExpressSessionVO';

export default class ModuleExpressDBSessions extends Module {

    public static MODULE_NAME: string = "ExpressDBSessions";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleExpressDBSessions {
        if (!ModuleExpressDBSessions.instance) {
            ModuleExpressDBSessions.instance = new ModuleExpressDBSessions();
        }
        return ModuleExpressDBSessions.instance;
    }

    private static instance: ModuleExpressDBSessions = null;

    private constructor() {

        super("expressdbsessions", ModuleExpressDBSessions.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {

        this.initializeExpressSessionVO();
    }

    private initializeExpressSessionVO() {
        const sid = ModuleTableFieldController.create_new(ExpressSessionVO.API_TYPE_ID, field_names<ExpressSessionVO>().sid, ModuleTableFieldVO.FIELD_TYPE_string, 'SID', true).unique();

        const fields = [
            sid,
            ModuleTableFieldController.create_new(ExpressSessionVO.API_TYPE_ID, field_names<ExpressSessionVO>().sess, ModuleTableFieldVO.FIELD_TYPE_string, 'Session JSON', false),
            ModuleTableFieldController.create_new(ExpressSessionVO.API_TYPE_ID, field_names<ExpressSessionVO>().expire, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date d\'expiration', false),
        ];

        const table = ModuleTableController.create_new(this.name, ExpressSessionVO, sid, 'Sessions Express');
    }

}