import AccessPolicyTools from '../../tools/AccessPolicyTools';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleDAO from '../DAO/ModuleDAO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import VersionedVOController from '../Versioned/VersionedVOController';
import MenuElementVO from './vos/MenuElementVO';


export default class ModuleMenu extends Module {

    public static MODULE_NAME: string = 'Menu';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleMenu.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleMenu.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_get_menu = "get_menu";
    public static APINAME_add_menu = "add_menu";

    public static getInstance(): ModuleMenu {
        if (!ModuleMenu.instance) {
            ModuleMenu.instance = new ModuleMenu();
        }
        return ModuleMenu.instance;
    }

    private static instance: ModuleMenu = null;

    public get_menu: (app_name: string) => Promise<MenuElementVO[]> = APIControllerWrapper.sah(ModuleMenu.APINAME_get_menu);
    public add_menu: (app_name: string) => Promise<void> = APIControllerWrapper.sah(ModuleMenu.APINAME_add_menu);

    private constructor() {

        super("menu", ModuleMenu.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new GetAPIDefinition<StringParamVO, MenuElementVO[]>(
            null,
            ModuleMenu.APINAME_get_menu,
            [MenuElementVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_READ, MenuElementVO.API_TYPE_ID),
            ModuleMenu.APINAME_add_menu,
            [MenuElementVO.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeMenuElementVO();
    }

    private initializeMenuElementVO() {

        let name = new ModuleTableField('name', ModuleTableField.FIELD_TYPE_string, 'Titre', true);
        let menu_parent_id = new ModuleTableField('menu_parent_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Lien parent', false);

        let fields = [
            name,
            menu_parent_id,

            new ModuleTableField('app_name', ModuleTableField.FIELD_TYPE_string, 'Application', true),

            new ModuleTableField('target', ModuleTableField.FIELD_TYPE_string, 'Cible', false),
            new ModuleTableField('target_route_params', ModuleTableField.FIELD_TYPE_string, 'Paramètres de la route', false),
            new ModuleTableField('target_is_routename', ModuleTableField.FIELD_TYPE_boolean, 'La cible est une route ?', false, true, true),

            new ModuleTableField('hidden', ModuleTableField.FIELD_TYPE_boolean, 'Caché', false, true, false),
            new ModuleTableField('target_blank', ModuleTableField.FIELD_TYPE_boolean, 'Target _blank', false, true, false),

            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', false, true, 0),

            new ModuleTableField('fa_class', ModuleTableField.FIELD_TYPE_string, 'Classe font-awesome', false),
            new ModuleTableField('access_policy_name', ModuleTableField.FIELD_TYPE_string, 'Clé du droit d\'accès', false, true, ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS),
        ];

        let table = new ModuleTable(this, MenuElementVO.API_TYPE_ID, () => new MenuElementVO(), fields, name, 'Menus');
        this.datatables.push(table);

        menu_parent_id.addManyToOneRelation(table);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}