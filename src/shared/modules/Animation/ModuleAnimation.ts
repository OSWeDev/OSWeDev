import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import RoleVO from '../AccessPolicy/vos/RoleVO';
import UserVO from '../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import { query } from '../ContextFilter/vos/ContextQueryVO';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import DataFilterOption from '../DataRender/vos/DataFilterOption';
import TimeSegment from '../DataRender/vos/TimeSegment';
import DocumentVO from '../Document/vos/DocumentVO';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TableFieldTypesManager from '../TableFieldTypes/TableFieldTypesManager';
import VarsInitController from '../Var/VarsInitController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import MessageModuleTableFieldTypeController from './fields/message_module/MessageModuleTableFieldTypeController';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import ReponseTableFieldTypeController from './fields/reponse/ReponseTableFieldTypeController';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleParamVO, { AnimationModuleParamVOStatic } from './params/AnimationModuleParamVO';
import AnimationParamVO, { AnimationParamVOStatic } from './params/AnimationParamVO';
import AnimationReportingParamVO, { AnimationReportingParamVOStatic } from './params/AnimationReportingParamVO';
import ThemeModuleDataRangesVO from './params/theme_module/ThemeModuleDataRangesVO';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationParametersVO from './vos/AnimationParametersVO';
import AnimationQRVO from './vos/AnimationQRVO';
import AnimationThemeVO from './vos/AnimationThemeVO';
import AnimationUserModuleVO from './vos/AnimationUserModuleVO';
import AnimationUserQRVO from './vos/AnimationUserQRVO';

export default class ModuleAnimation extends Module {

    public static MODULE_NAME: string = "Animation";

    public static EXPORT_API_TYPE_ID: string = 'AnimationReportingExport';

    // public static POLICY_BO_OTHERS_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + '.BO_OTHERS_ACCESS';

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

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAnimation {
        if (!ModuleAnimation.instance) {
            ModuleAnimation.instance = new ModuleAnimation();
        }
        return ModuleAnimation.instance;
    }

    private static instance: ModuleAnimation = null;

    public startModule: (user_id: number, module_id: number, support: number) => Promise<AnimationUserModuleVO> = APIControllerWrapper.sah(ModuleAnimation.APINAME_startModule);
    /** @see {@link ModuleAnimationServer.endModule} */
    public endModule: (user_id: number, module_id: number) => Promise<AnimationUserModuleVO> = APIControllerWrapper.sah(ModuleAnimation.APINAME_endModule);
    public getQRsByThemesAndModules: (theme_ids: number[], module_ids: number[]) => Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> = APIControllerWrapper.sah(ModuleAnimation.APINAME_getQRsByThemesAndModules);
    /** @see {@link ModuleAnimationServer.getUQRsByThemesAndModules} */
    public getUQRsByThemesAndModules: (user_ids: number[], theme_ids: number[], module_ids: number[]) => Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationUserQRVO[] } } }> = APIControllerWrapper.sah(ModuleAnimation.APINAME_getUQRsByThemesAndModules);
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

    public registerApis() {
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<AnimationModuleParamVO, AnimationUserModuleVO>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_startModule,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationModuleParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<AnimationModuleParamVO, AnimationUserModuleVO>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_endModule,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationModuleParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVOStatic,
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getUQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVOStatic,
        ));
        APIControllerWrapper.registerApi(new PostForGetAPIDefinition<AnimationReportingParamVO, AnimationUserModuleVO[]>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserModuleVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getAumsFiltered,
            [AnimationUserModuleVO.API_TYPE_ID],
            AnimationReportingParamVOStatic,
        ));
    }

    public async getUserModule(user_id: number, module_id: number): Promise<AnimationUserModuleVO> {
        let ums: AnimationUserModuleVO[] = await query(AnimationUserModuleVO.API_TYPE_ID)
            .filter_by_num_eq('module_id', module_id)
            .filter_by_num_eq('user_id', user_id)
            .select_vos<AnimationUserModuleVO>();

        return ums ? ums[0] : null;
    }

    public async getParameters(): Promise<AnimationParametersVO> {
        return await query(AnimationParametersVO.API_TYPE_ID).select_vo<AnimationParametersVO>();
    }

    //- ModuleTables
    private initializeAnimationParametersVO() {
        let image_home_id = ModuleTableFieldController.create_new(AnimationParametersVO.API_TYPE_ID, field_names<AnimationParametersVO>().image_home_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Image page d'accueil");
        let document_id_ranges = ModuleTableFieldController.create_new(AnimationParametersVO.API_TYPE_ID, field_names<AnimationParametersVO>().document_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Documents');

        let fields = [
            ModuleTableFieldController.create_new(AnimationParametersVO.API_TYPE_ID, field_names<AnimationParametersVO>().seuil_validation_module_prct, ModuleTableFieldVO.FIELD_TYPE_prct, "Seuil validation module"),
            ModuleTableFieldController.create_new(AnimationParametersVO.API_TYPE_ID, field_names<AnimationParametersVO>().limite_temps_passe_module, ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes, "Limite temps passé par module"),
            image_home_id,
            document_id_ranges,
        ];

        let datatable = new ModuleTableVO(this, AnimationParametersVO.API_TYPE_ID, () => new AnimationParametersVO(), fields, null, "Animation - Params");

        image_home_id.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        document_id_ranges.set_many_to_one_target_moduletable_name(DocumentVO.API_TYPE_ID);

        this.datatables.push(datatable);
    }

    private initializeAnimationThemeVO() {
        let name_field = ModuleTableFieldController.create_new(AnimationThemeVO.API_TYPE_ID, field_names<AnimationThemeVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom du thème", true);
        let id_import = ModuleTableFieldController.create_new(AnimationThemeVO.API_TYPE_ID, field_names<AnimationThemeVO>().id_import, ModuleTableFieldVO.FIELD_TYPE_string, "id for import");

        let fields = [
            ModuleTableFieldController.create_new(AnimationThemeVO.API_TYPE_ID, field_names<AnimationThemeVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Ordre d'affichage"),
            name_field,
            ModuleTableFieldController.create_new(AnimationThemeVO.API_TYPE_ID, field_names<AnimationThemeVO>().description, ModuleTableFieldVO.FIELD_TYPE_html, "Description"),
            id_import,
        ];

        let datatable = new ModuleTableVO(this, AnimationThemeVO.API_TYPE_ID, () => new AnimationThemeVO(), fields, name_field, "Animation - Thème");

        this.datatables.push(datatable);
    }

    private initializeAnimationModuleVO() {
        let name_field = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom du module", true);
        let computed_name_field = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().computed_name, ModuleTableFieldVO.FIELD_TYPE_string, "Nom du module computed").hide_from_datatable();
        let theme_id_field = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().theme_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Thème", true);
        let document_id_field = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().document_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Document explicatif");
        let role_id_ranges = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().role_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, "Roles ayant le droit d'accès (si vide, tous)");
        let id_import = ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().id_import, ModuleTableFieldVO.FIELD_TYPE_string, "id for import");

        let fields = [
            ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Ordre d'affichage"),
            theme_id_field,
            role_id_ranges,
            name_field,
            ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().description, ModuleTableFieldVO.FIELD_TYPE_html, "Description"),
            ModuleTableFieldController.create_new(AnimationModuleVO.API_TYPE_ID, field_names<AnimationModuleVO>().messages, AnimationMessageModuleVO.API_TYPE_ID, 'Messages'),
            document_id_field,
            computed_name_field,
            id_import,
        ];

        let datatable = new ModuleTableVO(this, AnimationModuleVO.API_TYPE_ID, () => new AnimationModuleVO(), fields, computed_name_field, "Animation - Module");

        theme_id_field.set_many_to_one_target_moduletable_name(AnimationThemeVO.API_TYPE_ID);
        document_id_field.set_many_to_one_target_moduletable_name(DocumentVO.API_TYPE_ID);
        role_id_ranges.set_many_to_one_target_moduletable_name(RoleVO.API_TYPE_ID);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(MessageModuleTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationQRVO() {
        let name_field = ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, "Type de question", true);
        let module_id_field = ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().module_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Module", true);
        let question_file_id_field = ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().question_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Photo ou Vidéo pour la question");
        let reponse_file_id_field = ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().reponse_file_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Photo ou Vidéo pour la réponse");

        let fields = [
            ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, "Ordre d'affichage"),
            module_id_field,
            name_field,
            ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().description, ModuleTableFieldVO.FIELD_TYPE_html, "Question"),
            ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().reponses, AnimationReponseVO.API_TYPE_ID, 'Réponses'),
            ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().explicatif, ModuleTableFieldVO.FIELD_TYPE_html, "Explicatif de la réponse"),
            ModuleTableFieldController.create_new(AnimationQRVO.API_TYPE_ID, field_names<AnimationQRVO>().external_video, ModuleTableFieldVO.FIELD_TYPE_string, 'Vidéo externe'),
            question_file_id_field,
            reponse_file_id_field,
        ];

        let datatable = new ModuleTableVO(this, AnimationQRVO.API_TYPE_ID, () => new AnimationQRVO(), fields, name_field, "Animation - Question/Réponses");

        module_id_field.set_many_to_one_target_moduletable_name(AnimationModuleVO.API_TYPE_ID);
        question_file_id_field.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
        reponse_file_id_field.set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(ReponseTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationUserModuleVO() {
        let module_id_field = ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().module_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Module", true);
        let user_id_field = ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Début").set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Fin").set_segmentation_type(TimeSegment.TYPE_SECOND),
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().like_vote, ModuleTableFieldVO.FIELD_TYPE_enum, "Like").setEnumValues(AnimationUserModuleVO.LIKE_VOTE_LABELS),
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().support, ModuleTableFieldVO.FIELD_TYPE_enum, "Support utilisé").setEnumValues(AnimationUserModuleVO.SUPPORT_LABELS),
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().commentaire, ModuleTableFieldVO.FIELD_TYPE_html, "Commentaire"),
            ModuleTableFieldController.create_new(AnimationUserModuleVO.API_TYPE_ID, field_names<AnimationUserModuleVO>().prct_reussite, ModuleTableFieldVO.FIELD_TYPE_prct, "Pourcentage réussite"),
            module_id_field,
            user_id_field,
        ];

        let datatable = new ModuleTableVO(this, AnimationUserModuleVO.API_TYPE_ID, () => new AnimationUserModuleVO(), fields, null, "Animation - Info module utilisateur");

        module_id_field.set_many_to_one_target_moduletable_name(AnimationModuleVO.API_TYPE_ID);
        user_id_field.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        this.datatables.push(datatable);
    }

    private initializeAnimationUserQRVO() {
        let qr_id_field = ModuleTableFieldController.create_new(AnimationUserQRVO.API_TYPE_ID, field_names<AnimationUserQRVO>().qr_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Question/Réponses", true);
        let user_id_field = ModuleTableFieldController.create_new(AnimationUserQRVO.API_TYPE_ID, field_names<AnimationUserQRVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            ModuleTableFieldController.create_new(AnimationUserQRVO.API_TYPE_ID, field_names<AnimationUserQRVO>().reponses, ModuleTableFieldVO.FIELD_TYPE_int_array, "Réponses"),
            qr_id_field,
            user_id_field,
            ModuleTableFieldController.create_new(AnimationUserQRVO.API_TYPE_ID, field_names<AnimationUserQRVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, "Date").set_segmentation_type(TimeSegment.TYPE_SECOND),
        ];

        let datatable = new ModuleTableVO(this, AnimationUserQRVO.API_TYPE_ID, () => new AnimationUserQRVO(), fields, null, "Animation - Info réponses utilisateur");

        qr_id_field.set_many_to_one_target_moduletable_name(AnimationQRVO.API_TYPE_ID);
        user_id_field.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);

        this.datatables.push(datatable);
    }

    private initializeThemeModuleDataRangesVO() {
        let theme_id_ranges = ModuleTableFieldController.create_new(ThemeModuleDataRangesVO.API_TYPE_ID, field_names<ThemeModuleDataRangesVO>().theme_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Themes', true);
        let module_id_ranges = ModuleTableFieldController.create_new(ThemeModuleDataRangesVO.API_TYPE_ID, field_names<ThemeModuleDataRangesVO>().module_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Modules', true);
        let user_id_ranges = ModuleTableFieldController.create_new(ThemeModuleDataRangesVO.API_TYPE_ID, field_names<ThemeModuleDataRangesVO>().user_id_ranges, ModuleTableFieldVO.FIELD_TYPE_numrange_array, 'Users', true);

        let datatable_fields = [
            theme_id_ranges,
            module_id_ranges,
            user_id_ranges
        ];

        VarsInitController.getInstance().register_var_data(ThemeModuleDataRangesVO.API_TYPE_ID, () => new ThemeModuleDataRangesVO(), datatable_fields, this);

        theme_id_ranges.set_many_to_one_target_moduletable_name(AnimationThemeVO.API_TYPE_ID);
        module_id_ranges.set_many_to_one_target_moduletable_name(AnimationModuleVO.API_TYPE_ID);
        user_id_ranges.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    }
}