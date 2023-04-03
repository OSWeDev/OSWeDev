import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import ExpressSessionVO from './vos/ExpressSessionVO';

export default class ModuleExpressDBSessions extends Module {

    public static MODULE_NAME: string = "ExpressDBSessions";

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
        this.fields = [];
        this.datatables = [];

        this.initializeExpressSessionVO();
    }

    private initializeExpressSessionVO() {
        let sid = new ModuleTableField('sid', ModuleTableField.FIELD_TYPE_string, 'SID', true).unique();

        let fields = [
            sid,
            new ModuleTableField('sess', ModuleTableField.FIELD_TYPE_string, 'Session JSON', false),
            new ModuleTableField('expire', ModuleTableField.FIELD_TYPE_tstz, 'Date d\'expiration', false),
        ];

        let table = new ModuleTable(this, ExpressSessionVO.API_TYPE_ID, () => new ExpressSessionVO(), fields, sid, 'Sessions Express');
        this.datatables.push(table);
    }

}