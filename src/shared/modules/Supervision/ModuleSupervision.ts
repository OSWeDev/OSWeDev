import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAPI from '../API/ModuleAPI';
import StringParamVO from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import SupervisedCategoryVO from './vos/SupervisedCategoryVO';

export default class ModuleSupervision extends Module {

    public static MODULE_NAME: string = "Supervision";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSupervision.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSupervision.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_execute_manually: string = 'execute_manually';

    public static getInstance(): ModuleSupervision {
        if (!ModuleSupervision.instance) {
            ModuleSupervision.instance = new ModuleSupervision();
        }
        return ModuleSupervision.instance;
    }

    private static instance: ModuleSupervision = null;

    private constructor() {

        super("supervision", ModuleSupervision.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<StringParamVO, void>(
            ModuleSupervision.POLICY_BO_ACCESS,
            ModuleSupervision.APINAME_execute_manually,
            (param: StringParamVO) => [param.text],
            StringParamVO.translateCheckAccessParams
        ));
    }

    public async execute_manually(api_type_id: string) {
        return await ModuleAPI.getInstance().handleAPI(ModuleSupervision.APINAME_execute_manually, api_type_id);
    }

    public initialize() {
        this.datatables = [];

        this.initializeSupervisedCategoryVO();
    }

    private initializeSupervisedCategoryVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom", true);

        let fields = [
            name_field,
            new ModuleTableField('notify', ModuleTableField.FIELD_TYPE_boolean, "Notification", true, true, false),
        ];

        let datatable = new ModuleTable(this, SupervisedCategoryVO.API_TYPE_ID, () => new SupervisedCategoryVO(), fields, name_field, "Supervision - Catégorie");

        this.datatables.push(datatable);
    }
}