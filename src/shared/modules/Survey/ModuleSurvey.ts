import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import SurveyParamVO from './vos/SurveyParamVO';
import SurveyVO from './vos/SurveyVO';
import ModuleTableController from '../DAO/ModuleTableController';


export default class ModuleSurvey extends Module {

    public static MODULE_NAME: string = 'Survey';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSurvey.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSurvey.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSurvey.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_survey: string = "survey";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSurvey {
        if (!ModuleSurvey.instance) {
            ModuleSurvey.instance = new ModuleSurvey();
        }
        return ModuleSurvey.instance;
    }

    private static instance: ModuleSurvey = null;

    public survey: (survey: SurveyVO) => Promise<boolean> = APIControllerWrapper.sah(ModuleSurvey.APINAME_survey);

    private constructor() {

        super("survey", ModuleSurvey.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<APISimpleVOParamVO, boolean>(
            ModuleSurvey.POLICY_FO_ACCESS,
            ModuleSurvey.APINAME_survey,
            [SurveyVO.API_TYPE_ID],
            APISimpleVOParamVOStatic
        ));
    }

    public initialize() {

        this.initializeSurveyVO();
        this.initializeParamSurveyVO();
    }

    private initializeSurveyVO() {
        const user_id = ModuleTableFieldController.create_new(SurveyVO.API_TYPE_ID, field_names<SurveyVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        const fields = [
            user_id,

            ModuleTableFieldController.create_new(SurveyVO.API_TYPE_ID, field_names<SurveyVO>().message, ModuleTableFieldVO.FIELD_TYPE_string, 'Message', false).hide_from_datatable(),
            ModuleTableFieldController.create_new(SurveyVO.API_TYPE_ID, field_names<SurveyVO>().survey_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Avis', true).setEnumValues(SurveyVO.SURVEY_TYPE_LABELS),
            ModuleTableFieldController.create_new(SurveyVO.API_TYPE_ID, field_names<SurveyVO>().route_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Route du module enquêté', true).hide_from_datatable(),
        ];

        const table = ModuleTableController.create_new(this.name, SurveyVO, null, 'Surveys');

        user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeParamSurveyVO() {

        const fields = [
            ModuleTableFieldController.create_new(SurveyParamVO.API_TYPE_ID, field_names<SurveyParamVO>().route_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Route pour laquelle le survey existe ', true),
            ModuleTableFieldController.create_new(SurveyParamVO.API_TYPE_ID, field_names<SurveyParamVO>().pop_up, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Affichage automatique ou manuel ?', false),
            ModuleTableFieldController.create_new(SurveyParamVO.API_TYPE_ID, field_names<SurveyParamVO>().time_before_pop_up, ModuleTableFieldVO.FIELD_TYPE_float, 'Temps avant affichage', true),
            ModuleTableFieldController.create_new(SurveyParamVO.API_TYPE_ID, field_names<SurveyParamVO>().content, ModuleTableFieldVO.FIELD_TYPE_html, 'Contenu'),
        ];

        const table = ModuleTableController.create_new(this.name, SurveyParamVO, null, 'SurveysParam');


        VersionedVOController.getInstance().registerModuleTable(table);
    }
}