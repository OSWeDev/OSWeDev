import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import APISimpleVOParamVO, { APISimpleVOParamVOStatic } from '../DAO/vos/APISimpleVOParamVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import VOsTypesManager from '../VOsTypesManager';
import SurveyVO from './vos/SurveyVO';
import SurveyParamVO from './vos/SurveyParamVO';


export default class ModuleSurvey extends Module {

    public static MODULE_NAME: string = 'Survey';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleSurvey.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSurvey.MODULE_NAME + '.BO_ACCESS';
    public static POLICY_FO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleSurvey.MODULE_NAME + '.FO_ACCESS';

    public static APINAME_survey: string = "survey";

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

        APIControllerWrapper.getInstance().registerApi(new PostAPIDefinition<APISimpleVOParamVO, boolean>(
            ModuleSurvey.POLICY_FO_ACCESS,
            ModuleSurvey.APINAME_survey,
            [SurveyVO.API_TYPE_ID],
            APISimpleVOParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeSurveyVO();
        this.initializeParamSurveyVO();
    }

    private initializeSurveyVO() {
        let user_id = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Utilisateur', true);

        let fields = [
            user_id,

            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'Message', true).hide_from_datatable(),


            new ModuleTableField('survey_type', ModuleTableField.FIELD_TYPE_enum, 'Avis', true, true, SurveyVO.SURVEY_TYPE_NOT_SET).setEnumValues(SurveyVO.SURVEY_TYPE_LABELS),

            new ModuleTableField('survey_route_name', ModuleTableField.FIELD_TYPE_string, 'URL fin Survey', true).hide_from_datatable(),


        ];

        let table = new ModuleTable(this, SurveyVO.API_TYPE_ID, () => new SurveyVO(), fields, null, 'Surveys');
        this.datatables.push(table);

        user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        VersionedVOController.getInstance().registerModuleTable(table);
    }

    private initializeParamSurveyVO() {

        let fields = [


            new ModuleTableField('route_name', ModuleTableField.FIELD_TYPE_string, 'Route pour laquelle le survey existe ', true),

            new ModuleTableField('pop_up', ModuleTableField.FIELD_TYPE_boolean, 'Affichage automatique ou manuel ?', false),

            new ModuleTableField('time_before_pop_up', ModuleTableField.FIELD_TYPE_float, 'Temps avant affichage', true),


        ];

        let table = new ModuleTable(this, SurveyParamVO.API_TYPE_ID, () => new SurveyParamVO(), fields, null, 'SurveysParam');
        this.datatables.push(table);


        VersionedVOController.getInstance().registerModuleTable(table);
    }
}