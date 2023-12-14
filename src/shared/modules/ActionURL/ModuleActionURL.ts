import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ActionURLUserVO from './vos/ActionURLUserVO';
import ActionURLVO from './vos/ActionURLVO';

export default class ModuleActionURL extends Module {

    public static MODULE_NAME: string = 'ActionURL';

    public static APINAME_action_url: string = "action_url";

    public static getInstance(): ModuleActionURL {
        if (!ModuleActionURL.instance) {
            ModuleActionURL.instance = new ModuleActionURL();
        }
        return ModuleActionURL.instance;
    }

    private static instance: ModuleActionURL = null;

    public action_url: (code: string) => Promise<void> = APIControllerWrapper.sah<StringParamVO, void>(ModuleActionURL.APINAME_action_url);

    private constructor() {

        super("action_url", ModuleActionURL.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, void>(
            null,
            ModuleActionURL.APINAME_action_url,
            [ActionURLVO.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.datatables = [];

        this.initializeActionURL();
        this.initializeActionURLUserVO();
    }

    private initializeActionURL() {
        let label = new ModuleTableField('action_name', ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        let fields = [
            new ModuleTableField('valid_ts_range', ModuleTableField.FIELD_TYPE_tsrange, 'Période de validité', true),
            new ModuleTableField('action_code', ModuleTableField.FIELD_TYPE_string, 'Code', true),
            label,
            new ModuleTableField('action_callback_module_name', ModuleTableField.FIELD_TYPE_string, 'Module de callback', true),
            new ModuleTableField('action_callback_function_name', ModuleTableField.FIELD_TYPE_string, 'Fonction de callback', true),
            new ModuleTableField('params_json', ModuleTableField.FIELD_TYPE_string, 'Paramètres', false),
            new ModuleTableField('action_remaining_counter', ModuleTableField.FIELD_TYPE_int, 'Nombre d\'utilisations restantes', true, true, 1),
        ];

        let table = new ModuleTable(this, ActionURLVO.API_TYPE_ID, () => new ActionURLVO(), fields, null, 'URLs d\'action');
        this.datatables.push(table);
    }

    private initializeActionURLUserVO() {
        let action_id = new ModuleTableField(field_names<ActionURLUserVO>().action_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Action', true);
        let user_id = new ModuleTableField(field_names<ActionURLUserVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let fields = [
            action_id,
            user_id,
        ];

        let table = new ModuleTable(this, ActionURLUserVO.API_TYPE_ID, () => new ActionURLUserVO(), fields, null, 'Droits usage URL d\'action');
        this.datatables.push(table);

        action_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ActionURLVO.API_TYPE_ID]);
        user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }
}