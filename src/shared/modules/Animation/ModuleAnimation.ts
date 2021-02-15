import AccessPolicyTools from '../../tools/AccessPolicyTools';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import ModuleAPI from '../API/ModuleAPI';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import TimeSegment from '../DataRender/vos/TimeSegment';
import DocumentVO from '../Document/vos/DocumentVO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import TableFieldTypesManager from '../TableFieldTypes/TableFieldTypesManager';
import VarsInitController from '../Var/VarsInitController';
import VOsTypesManager from '../VOsTypesManager';
import AnimationController from './AnimationController';
import MessageModuleTableFieldTypeController from './fields/message_module/MessageModuleTableFieldTypeController';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import ReponseTableFieldTypeController from './fields/reponse/ReponseTableFieldTypeController';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleParamVO, { AnimationModuleParamVOStatic } from './params/AnimationModuleParamVO';
import AnimationParamVO, { AnimationParamVOStatic } from './params/AnimationParamVO';
import AnimationReportingParamVO, { AnimationReportingParamVOStatic } from './params/AnimationReportingParamVO';
import ThemeModuleDataRangesVO from './params/theme_module/ThemeModuleDataRangesVO';
import VarDayPrctAtteinteSeuilAnimationController from './vars/VarDayPrctAtteinteSeuilAnimationController';
import VarDayPrctAvancementAnimationController from './vars/VarDayPrctAvancementAnimationController';
import VarDayPrctReussiteAnimationController from './vars/VarDayPrctReussiteAnimationController';
import VarDayTempsPasseAnimationController from './vars/VarDayTempsPasseAnimationController';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationParametersVO from './vos/AnimationParametersVO';
import AnimationQRVO from './vos/AnimationQRVO';
import AnimationThemeVO from './vos/AnimationThemeVO';
import AnimationUserModuleVO from './vos/AnimationUserModuleVO';
import AnimationUserQRVO from './vos/AnimationUserQRVO';

export default class ModuleAnimation extends Module {

    public static MODULE_NAME: string = "Animation";

    public static EXPORT_API_TYPE_ID: string = 'AnimationReportingExport';

    public static APINAME_startModule: string = "startModule";
    public static APINAME_endModule: string = "endModule";
    public static APINAME_getQRsByThemesAndModules: string = "getQRsByThemesAndModules";
    public static APINAME_getUQRsByThemesAndModules: string = "getUQRsByThemesAndModules";
    public static APINAME_getAumsFiltered: string = "getAumsFiltered";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAnimation.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".FO_ACCESS";
    public static POLICY_FO_INLINE_EDIT_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".FO_INLINE_EDIT_ACCESS";
    public static POLICY_FO_REPORTING_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".REPORTING.FO_ACCESS";

    public static getInstance(): ModuleAnimation {
        if (!ModuleAnimation.instance) {
            ModuleAnimation.instance = new ModuleAnimation();
        }
        return ModuleAnimation.instance;
    }

    private static instance: ModuleAnimation = null;

    public startModule: (user_id: number, module_id: number) => Promise<AnimationUserModuleVO> = APIControllerWrapper.sah(ModuleAnimation.APINAME_startModule);
    public endModule: (user_id: number, module_id: number) => Promise<AnimationUserModuleVO> = APIControllerWrapper.sah(ModuleAnimation.APINAME_endModule);
    public getQRsByThemesAndModules: (theme_ids: number[], module_ids: number[]) => Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> = APIControllerWrapper.sah(ModuleAnimation.APINAME_getQRsByThemesAndModules);
    public getUQRsByThemesAndModules: (user_ids: number[], theme_ids: number[], module_ids: number[]) => Promise<{ [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }> = APIControllerWrapper.sah(ModuleAnimation.APINAME_getUQRsByThemesAndModules);
    public getAumsFiltered: (
        filter_anim_theme_active_options: DataFilterOption[],
        filter_anim_module_active_options: DataFilterOption[],
        filter_role_active_options: DataFilterOption[],
        filter_user_active_options: DataFilterOption[],
        filter_module_termine_active_option: DataFilterOption,
        filter_module_valide_active_option: DataFilterOption,
    ) => Promise<AnimationUserModuleVO[]> = APIControllerWrapper.sah(ModuleAnimation.APINAME_getAumsFiltered);

    private constructor() {
        super("animation", ModuleAnimation.MODULE_NAME);
    }

    public initialize() {
        this.datatables = [];

        this.initializeAnimationParametersVO();
        this.initializeAnimationThemeVO();
        this.initializeAnimationModuleVO();
        this.initializeAnimationQRVO();
        this.initializeAnimationUserModuleVO();
        this.initializeAnimationUserQRVO();
        this.initializeThemeModuleDataRangesVO();
    }

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.configure_vars();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await this.configure_vars();
        return true;
    }

    public registerApis() {
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<AnimationModuleParamVO, AnimationUserModuleVO>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_startModule,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationModuleParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<AnimationModuleParamVO, AnimationUserModuleVO>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_endModule,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationModuleParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVOStatic,
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getUQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVOStatic,
        ));
        APIControllerWrapper.getInstance().registerApi(new PostForGetAPIDefinition<AnimationReportingParamVO, AnimationUserModuleVO[]>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getAumsFiltered,
            [AnimationUserModuleVO.API_TYPE_ID],
            AnimationReportingParamVOStatic,
        ));
    }

    public async getUserModule(user_id: number, module_id: number): Promise<AnimationUserModuleVO> {
        let ums: AnimationUserModuleVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<AnimationUserModuleVO>(
            AnimationUserModuleVO.API_TYPE_ID,
            'module_id',
            [module_id],
            'user_id',
            [user_id],
        );

        return ums ? ums[0] : null;
    }

    public async getParameters(): Promise<AnimationParametersVO> {
        let res: AnimationParametersVO[] = await ModuleDAO.getInstance().getVos<AnimationParametersVO>(AnimationParametersVO.API_TYPE_ID);

        return res ? res[0] : null;
    }

    private initializeAnimationParametersVO() {
        let image_home_id = new ModuleTableField('image_home_id', ModuleTableField.FIELD_TYPE_foreign_key, "Image page d'accueil");
        let document_id_ranges = new ModuleTableField('document_id_ranges', ModuleTableField.FIELD_TYPE_refrange_array, 'Documents');

        let fields = [
            new ModuleTableField('seuil_validation_module_prct', ModuleTableField.FIELD_TYPE_prct, "Seuil validation module"),
            new ModuleTableField('limite_temps_passe_module', ModuleTableField.FIELD_TYPE_hours_and_minutes, "Limite temps passé par module"),
            image_home_id,
            document_id_ranges,
        ];

        let datatable = new ModuleTable(this, AnimationParametersVO.API_TYPE_ID, () => new AnimationParametersVO(), fields, null, "Animation - Params");

        image_home_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        document_id_ranges.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DocumentVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeAnimationThemeVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom du thème", true);

        let fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Description"),
        ];

        let datatable = new ModuleTable(this, AnimationThemeVO.API_TYPE_ID, () => new AnimationThemeVO(), fields, name_field, "Animation - Thème");

        this.datatables.push(datatable);
    }

    private initializeAnimationModuleVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom du module", true);
        let computed_name_field = new ModuleTableField('computed_name', ModuleTableField.FIELD_TYPE_string, "Nom du module computed").hide_from_datatable();
        let theme_id_field = new ModuleTableField('theme_id', ModuleTableField.FIELD_TYPE_foreign_key, "Thème", true);
        let document_id_field = new ModuleTableField('document_id', ModuleTableField.FIELD_TYPE_foreign_key, "Document explicatif");
        let role_id_ranges = new ModuleTableField('role_id_ranges', ModuleTableField.FIELD_TYPE_refrange_array, "Roles ayant le droit d'accès (si vide, tous)");

        let fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
            theme_id_field,
            role_id_ranges,
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Description"),
            new ModuleTableField('messages', AnimationMessageModuleVO.API_TYPE_ID, 'Messages'),
            document_id_field,
            computed_name_field,
        ];

        let datatable = new ModuleTable(this, AnimationModuleVO.API_TYPE_ID, () => new AnimationModuleVO(), fields, computed_name_field, "Animation - Module");

        theme_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationThemeVO.API_TYPE_ID]);
        document_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[DocumentVO.API_TYPE_ID]);
        role_id_ranges.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[RoleVO.API_TYPE_ID]);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(MessageModuleTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationQRVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Type de question", true);
        let module_id_field = new ModuleTableField('module_id', ModuleTableField.FIELD_TYPE_foreign_key, "Module", true);
        let question_file_id_field = new ModuleTableField('question_file_id', ModuleTableField.FIELD_TYPE_foreign_key, "Photo ou Vidéo pour la question");
        let reponse_file_id_field = new ModuleTableField('reponse_file_id', ModuleTableField.FIELD_TYPE_foreign_key, "Photo ou Vidéo pour la réponse");

        let fields = [
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
            module_id_field,
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Question"),
            new ModuleTableField('reponses', AnimationReponseVO.API_TYPE_ID, 'Réponses'),
            new ModuleTableField('explicatif', ModuleTableField.FIELD_TYPE_html, "Explicatif de la réponse"),
            new ModuleTableField('external_video', ModuleTableField.FIELD_TYPE_string, 'Vidéo externe'),
            question_file_id_field,
            reponse_file_id_field,
        ];

        let datatable = new ModuleTable(this, AnimationQRVO.API_TYPE_ID, () => new AnimationQRVO(), fields, name_field, "Animation - Question/Réponses");

        module_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationModuleVO.API_TYPE_ID]);
        question_file_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);
        reponse_file_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(ReponseTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationUserModuleVO() {
        let module_id_field = new ModuleTableField('module_id', ModuleTableField.FIELD_TYPE_foreign_key, "Module", true);
        let user_id_field = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_tstz, "Début").set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_tstz, "Fin").set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('like_vote', ModuleTableField.FIELD_TYPE_enum, "Like").setEnumValues(AnimationUserModuleVO.LIKE_VOTE_LABELS),
            new ModuleTableField('support', ModuleTableField.FIELD_TYPE_enum, "Support utilisé").setEnumValues(AnimationUserModuleVO.SUPPORT_LABELS),
            new ModuleTableField('commentaire', ModuleTableField.FIELD_TYPE_html, "Commentaire"),
            new ModuleTableField('prct_reussite', ModuleTableField.FIELD_TYPE_prct, "Pourcentage réussite"),
            module_id_field,
            user_id_field,
        ];

        let datatable = new ModuleTable(this, AnimationUserModuleVO.API_TYPE_ID, () => new AnimationUserModuleVO(), fields, null, "Animation - Info module utilisateur");

        module_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationModuleVO.API_TYPE_ID]);
        user_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeAnimationUserQRVO() {
        let qr_id_field = new ModuleTableField('qr_id', ModuleTableField.FIELD_TYPE_foreign_key, "Question/Réponses", true);
        let user_id_field = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            new ModuleTableField('reponses', ModuleTableField.FIELD_TYPE_int_array, "Réponses"),
            qr_id_field,
            user_id_field,
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, "Date").set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let datatable = new ModuleTable(this, AnimationUserQRVO.API_TYPE_ID, () => new AnimationUserQRVO(), fields, null, "Animation - Info réponses utilisateur");

        qr_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationQRVO.API_TYPE_ID]);
        user_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeThemeModuleDataRangesVO() {
        let datatable_fields = [
            new ModuleTableField('theme_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Themes'),
            new ModuleTableField('module_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Modules'),
            new ModuleTableField('user_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Users'),
        ];

        VarsInitController.getInstance().register_var_data(ThemeModuleDataRangesVO.API_TYPE_ID, () => new ThemeModuleDataRangesVO(), datatable_fields);
    }

    private async configure_vars() {
        await VarDayPrctAvancementAnimationController.getInstance().initialize();
        await VarDayPrctReussiteAnimationController.getInstance().initialize();
        await VarDayPrctAtteinteSeuilAnimationController.getInstance().initialize();
        await VarDayTempsPasseAnimationController.getInstance().initialize();
    }
}