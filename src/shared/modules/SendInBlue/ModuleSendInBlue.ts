import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import SendInBlueVO from './vos/SendInBlueVO';

export default class ModuleSendInBlue extends Module {

    public static MODULE_NAME: string = 'SendInBlue';

    public static getInstance(): ModuleSendInBlue {
        if (!ModuleSendInBlue.instance) {
            ModuleSendInBlue.instance = new ModuleSendInBlue();
        }
        return ModuleSendInBlue.instance;
    }

    private static instance: ModuleSendInBlue = null;

    private constructor() {

        super("sendinblue", ModuleSendInBlue.MODULE_NAME);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeSendInBlueVO();
    }

    public initializeSendInBlueVO(): void {
        let datatable_fields = [
            new ModuleTableField('api_key', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ fr: 'apiKey' }), true),
            new ModuleTableField('partnerKey', ModuleTableField.FIELD_TYPE_enum, new DefaultTranslation({ fr: 'partnerKey' }), true).setEnumValues(SendInBlueVO.ACCOUNT_TYPE),
        ];
        let datatable = new ModuleTable(this, SendInBlueVO.API_TYPE_ID, () => new SendInBlueVO(), datatable_fields, null, new DefaultTranslation({ fr: 'Parametres SendInBlue' }));
        this.datatables.push(datatable);
    }
}