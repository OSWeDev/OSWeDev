import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import DAOController from '../DAO/DAOController';
import ModuleDAO from '../DAO/ModuleDAO';
import Module from '../Module';
import ModuleTableVO from '../ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../ModuleTableFieldVO';
import VersionedVOController from '../Versioned/VersionedVOController';
import MenuElementVO from './vos/MenuElementVO';


export default class ModuleMenu extends Module {

    public static MODULE_NAME: string = 'Menu';

    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleMenu.MODULE_NAME;
    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleMenu.MODULE_NAME + ".BO_ACCESS";

    public static APINAME_get_menu = "get_menu";
    public static APINAME_add_menu = "add_menu";

    // istanbul ignore next: nothing to test
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

        this.initializeMenuElementVO();
    }

    private initializeMenuElementVO() {

        let name = ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre', true);
        let menu_parent_id = ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().menu_parent_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Lien parent', false);

        let fields = [
            name,
            menu_parent_id,

            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().app_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Application', true),

            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().target, ModuleTableFieldVO.FIELD_TYPE_string, 'Cible', false),
            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().target_route_params, ModuleTableFieldVO.FIELD_TYPE_string, 'Paramètres de la route', false),
            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().target_is_routename, ModuleTableFieldVO.FIELD_TYPE_boolean, 'La cible est une route ?', false, true, true),

            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().hidden, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Caché', false, true, false),
            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().target_blank, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Target _blank', false, true, false),

            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', false, true, 0),

            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().fa_class, ModuleTableFieldVO.FIELD_TYPE_string, 'Classe font-awesome', false),
            ModuleTableFieldController.create_new(MenuElementVO.API_TYPE_ID, field_names<MenuElementVO>().access_policy_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé du droit d\'accès', false, true, ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS),
        ];

        let table = new ModuleTableVO(this, MenuElementVO.API_TYPE_ID, () => new MenuElementVO(), fields, name, 'Menus');
        this.datatables.push(table);

        menu_parent_id.addManyToOneRelation(table);

        VersionedVOController.getInstance().registerModuleTable(table);
    }
}