import AccessPolicyTools from '../../tools/AccessPolicyTools';
import UserVO from '../AccessPolicy/vos/UserVO';
import ModuleAPI from '../API/ModuleAPI';
import PostForGetAPIDefinition from '../API/vos/PostForGetAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import FileVO from '../File/vos/FileVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import TableFieldTypesManager from '../TableFieldTypes/TableFieldTypesManager';
import ModuleVar from '../Var/ModuleVar';
import VOsTypesManager from '../VOsTypesManager';
import MessageModuleTableFieldTypeController from './fields/message_module/MessageModuleTableFieldTypeController';
import AnimationMessageModuleVO from './fields/message_module/vos/AnimationMessageModuleVO';
import ReponseTableFieldTypeController from './fields/reponse/ReponseTableFieldTypeController';
import AnimationReponseVO from './fields/reponse/vos/AnimationReponseVO';
import AnimationModuleParamVO from './params/AnimationModuleParamVO';
import AnimationParamVO from './params/AnimationParamVO';
import ThemeModuleDataParamRangesVO from './params/theme_module/ThemeModuleDataParamRangesVO';
import ThemeModuleDataRangesVO from './params/theme_module/ThemeModuleDataRangesVO';
import VarDayPrctAvancementAnimationController from './vars/VarDayPrctAvancementAnimationController';
import VarDayPrctReussiteAnimationController from './vars/VarDayPrctReussiteAnimationController';
import AnimationModuleVO from './vos/AnimationModuleVO';
import AnimationQRVO from './vos/AnimationQRVO';
import AnimationThemeVO from './vos/AnimationThemeVO';
import AnimationUserModuleVO from './vos/AnimationUserModuleVO';
import AnimationUserQRVO from './vos/AnimationUserQRVO';

export default class ModuleAnimation extends Module {

    public static MODULE_NAME: string = "Animation";

    public static APINAME_startModule: string = "startModule";
    public static APINAME_getQRsByThemesAndModules: string = "getQRsByThemesAndModules";
    public static APINAME_getUQRsByThemesAndModules: string = "getUQRsByThemesAndModules";

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleAnimation.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleAnimation.MODULE_NAME + ".FO_ACCESS";

    public static getInstance(): ModuleAnimation {
        if (!ModuleAnimation.instance) {
            ModuleAnimation.instance = new ModuleAnimation();
        }
        return ModuleAnimation.instance;
    }

    private static instance: ModuleAnimation = null;

    private constructor() {
        super("animation", ModuleAnimation.MODULE_NAME);
    }

    public initialize() {
        this.datatables = [];

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
        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<AnimationModuleParamVO, boolean>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_startModule,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationModuleParamVO.translateCheckAccessParams
        ));
        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVO.translateCheckAccessParams,
        ));
        ModuleAPI.getInstance().registerApi(new PostForGetAPIDefinition<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }>(
            ModuleDAO.getInstance().getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, AnimationUserQRVO.API_TYPE_ID),
            ModuleAnimation.APINAME_getUQRsByThemesAndModules,
            [AnimationQRVO.API_TYPE_ID, AnimationUserModuleVO.API_TYPE_ID, AnimationUserQRVO.API_TYPE_ID, AnimationModuleVO.API_TYPE_ID],
            AnimationParamVO.translateCheckAccessParams,
        ));
    }

    public async startModule(user_id: number, module_id: number): Promise<boolean> {
        return ModuleAPI.getInstance().handleAPI<AnimationModuleParamVO, boolean>(ModuleAnimation.APINAME_startModule, user_id, module_id);
    }

    public async getQRsByThemesAndModules(theme_ids: number[], module_ids: number[]): Promise<{ [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }> {
        return ModuleAPI.getInstance().handleAPI<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [qr_id: number]: AnimationQRVO } } }>(
            ModuleAnimation.APINAME_getQRsByThemesAndModules,
            null,
            theme_ids,
            module_ids
        );
    }

    public async getUQRsByThemesAndModules(user_id: number, theme_ids: number[], module_ids: number[]): Promise<{ [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }> {
        return ModuleAPI.getInstance().handleAPI<AnimationParamVO, { [theme_id: number]: { [module_id: number]: { [uqr_id: number]: AnimationUserQRVO } } }>(
            ModuleAnimation.APINAME_getUQRsByThemesAndModules,
            user_id,
            theme_ids,
            module_ids
        );
    }

    private initializeAnimationThemeVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom", true);

        let fields = [
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Description"),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
        ];

        let datatable = new ModuleTable(this, AnimationThemeVO.API_TYPE_ID, () => new AnimationThemeVO(), fields, name_field, "Animation - Thème");

        this.datatables.push(datatable);
    }

    private initializeAnimationModuleVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom", true);
        let theme_id_field = new ModuleTableField('theme_id', ModuleTableField.FIELD_TYPE_foreign_key, "Thème", true);

        let fields = [
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Description"),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
            new ModuleTableField('type_module', ModuleTableField.FIELD_TYPE_enum, "Type module").setEnumValues(AnimationModuleVO.TYPE_MODULE_LABELS),
            new ModuleTableField('messages', AnimationMessageModuleVO.API_TYPE_ID, 'Messages'),
            theme_id_field
        ];

        let datatable = new ModuleTable(this, AnimationModuleVO.API_TYPE_ID, () => new AnimationModuleVO(), fields, name_field, "Animation - Module");

        theme_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationThemeVO.API_TYPE_ID]);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(MessageModuleTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationQRVO() {
        let name_field = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, "Nom", true);
        let module_id_field = new ModuleTableField('module_id', ModuleTableField.FIELD_TYPE_foreign_key, "Module", true);
        let file_id_field = new ModuleTableField('file_id', ModuleTableField.FIELD_TYPE_foreign_key, "Fichier");

        let fields = [
            name_field,
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_html, "Description"),
            new ModuleTableField('explicatif', ModuleTableField.FIELD_TYPE_html, "Explicatif réponse"),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, "Ordre d'affichage"),
            new ModuleTableField('reponses', AnimationReponseVO.API_TYPE_ID, 'Réponses'),
            module_id_field,
            file_id_field,
        ];

        let datatable = new ModuleTable(this, AnimationQRVO.API_TYPE_ID, () => new AnimationQRVO(), fields, name_field, "Animation - Question/Réponses");

        module_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationModuleVO.API_TYPE_ID]);
        file_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[FileVO.API_TYPE_ID]);

        TableFieldTypesManager.getInstance().registerTableFieldTypeController(ReponseTableFieldTypeController.getInstance());

        this.datatables.push(datatable);
    }

    private initializeAnimationUserModuleVO() {
        let module_id_field = new ModuleTableField('module_id', ModuleTableField.FIELD_TYPE_foreign_key, "Module", true);
        let user_id_field = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, "Utilisateur", true);

        let fields = [
            new ModuleTableField('like_vote', ModuleTableField.FIELD_TYPE_boolean, "Like"),
            new ModuleTableField('commentaire', ModuleTableField.FIELD_TYPE_html, "Commentaire"),
            new ModuleTableField('start_date', ModuleTableField.FIELD_TYPE_tstz, "Début").set_segmentation_type(TimeSegment.TYPE_SECOND),
            new ModuleTableField('end_date', ModuleTableField.FIELD_TYPE_tstz, "Fin").set_segmentation_type(TimeSegment.TYPE_SECOND),
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
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, "Date").set_segmentation_type(TimeSegment.TYPE_SECOND),
            qr_id_field,
            user_id_field,
        ];

        let datatable = new ModuleTable(this, AnimationUserQRVO.API_TYPE_ID, () => new AnimationUserQRVO(), fields, null, "Animation - Info réponses utilisateur");

        qr_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationQRVO.API_TYPE_ID]);
        user_id_field.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        this.datatables.push(datatable);
    }

    private initializeThemeModuleDataRangesVO() {
        let datatable_fields = [
            new ModuleTableField('theme_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Themes'),
            new ModuleTableField('module_id_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Modules'),
        ];

        ModuleVar.getInstance().register_simple_number_var_data(ThemeModuleDataRangesVO.API_TYPE_ID, ThemeModuleDataParamRangesVO.API_TYPE_ID, () => new ThemeModuleDataRangesVO(), datatable_fields);
    }

    private async configure_vars() {
        await VarDayPrctAvancementAnimationController.getInstance().initialize();
        await VarDayPrctReussiteAnimationController.getInstance().initialize();
    }
}