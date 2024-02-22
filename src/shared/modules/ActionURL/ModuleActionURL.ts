import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import StringAndBooleanParamVO, { StringAndBooleanParamVOStatic } from '../API/vos/apis/StringAndBooleanParamVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ActionURLCRVO from './vos/ActionURLCRVO';
import ActionURLUserVO from './vos/ActionURLUserVO';
import ActionURLVO from './vos/ActionURLVO';

export default class ModuleActionURL extends Module {

    public static MODULE_NAME: string = 'ActionURL';

    public static APINAME_action_url: string = "action_url";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleActionURL {
        if (!ModuleActionURL.instance) {
            ModuleActionURL.instance = new ModuleActionURL();
        }
        return ModuleActionURL.instance;
    }

    private static instance: ModuleActionURL = null;

    public action_url: (code: string, do_not_redirect: boolean) => Promise<boolean> = APIControllerWrapper.sah<StringAndBooleanParamVO, boolean>(ModuleActionURL.APINAME_action_url);

    private constructor() {

        super("action_url", ModuleActionURL.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringAndBooleanParamVO, boolean>(
            null,
            ModuleActionURL.APINAME_action_url,
            [ActionURLVO.API_TYPE_ID],
            StringAndBooleanParamVOStatic
        ));
    }

    public initialize() {
        this.datatables = [];

        this.initializeActionURL();
        this.initializeActionURLUserVO();
        this.initializeActionURLCRVO();
    }

    private initializeActionURLCRVO() {
        let action_url_id = new ModuleTableField(field_names<ActionURLCRVO>().action_url_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Action URL', true);

        let fields = [
            action_url_id,

            new ModuleTableField(field_names<ActionURLCRVO>().translatable_cr_title, ModuleTableField.FIELD_TYPE_html, 'Titre du CR', true, true, ''),
            new ModuleTableField(field_names<ActionURLCRVO>().translatable_cr_title_params_json, ModuleTableField.FIELD_TYPE_string, 'Params de traduction du titre (JSON)', false),

            new ModuleTableField(field_names<ActionURLCRVO>().translatable_cr_content, ModuleTableField.FIELD_TYPE_html, 'Corps du CR', false),
            new ModuleTableField(field_names<ActionURLCRVO>().translatable_cr_content_params_json, ModuleTableField.FIELD_TYPE_string, 'Params de traduction du contenu (JSON)', false),

            new ModuleTableField(field_names<ActionURLCRVO>().ts, ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
            new ModuleTableField(field_names<ActionURLCRVO>().cr_type, ModuleTableField.FIELD_TYPE_enum, 'Type', true, true, ActionURLCRVO.CR_TYPE_INFO).setEnumValues(ActionURLCRVO.CR_TYPE_LABELS),
        ];

        let table = new ModuleTable(this, ActionURLCRVO.API_TYPE_ID, () => new ActionURLCRVO(), fields, null, 'CR URLs d\'action');
        this.datatables.push(table);

        action_url_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ActionURLVO.API_TYPE_ID]);
    }

    private initializeActionURL() {
        let label = new ModuleTableField(field_names<ActionURLVO>().action_name, ModuleTableField.FIELD_TYPE_string, 'Nom', true);

        let fields = [
            new ModuleTableField(field_names<ActionURLVO>().valid_ts_range, ModuleTableField.FIELD_TYPE_tsrange, 'Période de validité', true),
            new ModuleTableField(field_names<ActionURLVO>().action_code, ModuleTableField.FIELD_TYPE_string, 'Code', true),
            label,
            new ModuleTableField(field_names<ActionURLVO>().state, ModuleTableField.FIELD_TYPE_enum, 'Etat', true, true, ActionURLVO.STATE_ACTIVATED).setEnumValues(ActionURLVO.STATE_LABELS),
            new ModuleTableField(field_names<ActionURLVO>().action_callback_module_name, ModuleTableField.FIELD_TYPE_string, 'Module de callback', true),
            new ModuleTableField(field_names<ActionURLVO>().action_callback_function_name, ModuleTableField.FIELD_TYPE_string, 'Fonction de callback', true),
            new ModuleTableField(field_names<ActionURLVO>().params_json, ModuleTableField.FIELD_TYPE_string, 'Paramètres', false),
            new ModuleTableField(field_names<ActionURLVO>().action_remaining_counter, ModuleTableField.FIELD_TYPE_int, 'Nombre d\'utilisations restantes', true, true, 1),
            new ModuleTableField(field_names<ActionURLVO>().button_translatable_name, ModuleTableField.FIELD_TYPE_translatable_text, 'Nom du bouton', false).set_translatable_params_field_name(field_names<ActionURLVO>().button_translatable_name_params_json),
            new ModuleTableField(field_names<ActionURLVO>().button_translatable_name_params_json, ModuleTableField.FIELD_TYPE_string, 'Paramètres du nom du bouton (JSON)', false),
            new ModuleTableField(field_names<ActionURLVO>().button_fc_icon_classnames, ModuleTableField.FIELD_TYPE_string_array, 'Icones du bouton', false),
            new ModuleTableField(field_names<ActionURLVO>().button_bootstrap_type, ModuleTableField.FIELD_TYPE_enum, 'Type de bouton', true, true, ActionURLVO.BOOTSTRAP_BUTTON_TYPE_PRIMARY).setEnumValues(ActionURLVO.BOOTSTRAP_BUTTON_TYPE_LABELS),
        ];

        let table = new ModuleTable(this, ActionURLVO.API_TYPE_ID, () => new ActionURLVO(), fields, label, 'URLs d\'action');
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