import { field_names } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import UpdateTeamsMessageVO, { UpdateTeamsMessageVOStatic } from './params/UpdateTeamsMessageVO';
import ActionURLCRVO from './vos/ActionURLCRVO';
import ActionURLUserVO from './vos/ActionURLUserVO';
import ActionURLVO from './vos/ActionURLVO';

export default class ModuleActionURL extends Module {

    public static MODULE_NAME: string = 'ActionURL';

    public static APINAME_action_url: string = "action_url";

    private static instance: ModuleActionURL = null;

    public action_url: (code: string, do_not_redirect: boolean) => Promise<boolean> = APIControllerWrapper.sah<UpdateTeamsMessageVO, boolean>(ModuleActionURL.APINAME_action_url);

    private constructor() {

        super("action_url", ModuleActionURL.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleActionURL {
        if (!ModuleActionURL.instance) {
            ModuleActionURL.instance = new ModuleActionURL();
        }
        return ModuleActionURL.instance;
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<UpdateTeamsMessageVO, boolean>(
            null,
            ModuleActionURL.APINAME_action_url,
            [ActionURLVO.API_TYPE_ID],
            UpdateTeamsMessageVOStatic
        ));
    }

    public initialize() {
        this.initializeActionURL();
        this.initializeActionURLUserVO();
        this.initializeActionURLCRVO();
    }

    private initializeActionURLCRVO() {
        const action_url_id = ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().action_url_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Action URL', true);

        const fields = [
            action_url_id,

            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().translatable_cr_title, ModuleTableFieldVO.FIELD_TYPE_html, 'Titre du CR', true, true, ''),
            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().translatable_cr_title_params_json, ModuleTableFieldVO.FIELD_TYPE_string, 'Params de traduction du titre (JSON)', false),

            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().translatable_cr_content, ModuleTableFieldVO.FIELD_TYPE_html, 'Corps du CR', false),
            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().translatable_cr_content_params_json, ModuleTableFieldVO.FIELD_TYPE_string, 'Params de traduction du contenu (JSON)', false),

            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().ts, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
            ModuleTableFieldController.create_new(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().cr_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type', true, true, ActionURLCRVO.CR_TYPE_INFO).setEnumValues(ActionURLCRVO.CR_TYPE_LABELS),
        ];

        const table = ModuleTableController.create_new(this.name, ActionURLCRVO, null, 'CR URLs d\'action');

        action_url_id.set_many_to_one_target_moduletable_name(ActionURLVO.API_TYPE_ID);
    }

    private initializeActionURL() {
        const label = ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().action_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom', true);

        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().valid_ts_range, ModuleTableFieldVO.FIELD_TYPE_tsrange, 'Période de validité', true);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().action_code, ModuleTableFieldVO.FIELD_TYPE_string, 'Code', true);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, ActionURLVO.STATE_ACTIVATED).setEnumValues(ActionURLVO.STATE_LABELS);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().action_callback_module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module de callback', true);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().action_callback_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction de callback', true);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().params, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètres', false);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().action_remaining_counter, ModuleTableFieldVO.FIELD_TYPE_int, 'Nombre d\'utilisations restantes', true, true, 1);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().button_translatable_name, ModuleTableFieldVO.FIELD_TYPE_translatable_text, 'Nom du bouton', false).set_translatable_params_field_name(field_names<ActionURLVO>().button_translatable_name_params_json);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().button_translatable_name_params_json, ModuleTableFieldVO.FIELD_TYPE_string, 'Paramètres du nom du bouton (JSON)', false);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().button_fc_icon_classnames, ModuleTableFieldVO.FIELD_TYPE_string_array, 'Icones du bouton', false);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().button_bootstrap_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de bouton', true, true, ActionURLVO.BOOTSTRAP_BUTTON_TYPE_PRIMARY).setEnumValues(ActionURLVO.BOOTSTRAP_BUTTON_TYPE_LABELS);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().teams_auto_close_message_on_completion, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Fermer le message Teams quand action_remaining_counter == 0', true, true, true);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().teams_message_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du message Teams', false);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().teams_group_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du groupe Teams', false);
        ModuleTableFieldController.create_new(ActionURLVO.API_TYPE_ID, field_names<ActionURLVO>().teams_channel_id, ModuleTableFieldVO.FIELD_TYPE_string, 'ID du canal Teams', false);

        ModuleTableController.create_new(this.name, ActionURLVO, label, 'URLs d\'action');
    }

    private initializeActionURLUserVO() {
        const action_id = ModuleTableFieldController.create_new(ActionURLUserVO.API_TYPE_ID, field_names<ActionURLUserVO>().action_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Action', true);
        const user_id = ModuleTableFieldController.create_new(ActionURLUserVO.API_TYPE_ID, field_names<ActionURLUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        const fields = [
            action_id,
            user_id,
        ];

        const table = ModuleTableController.create_new(this.name, ActionURLUserVO, null, 'Droits usage URL d\'action');

        action_id.set_many_to_one_target_moduletable_name(ActionURLVO.API_TYPE_ID);
        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}