import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleMenu from '../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleMenuServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMenuServer.instance) {
            ModuleMenuServer.instance = new ModuleMenuServer();
        }
        return ModuleMenuServer.instance;
    }

    private static instance: ModuleMenuServer = null;

    private constructor() {
        super(ModuleMenu.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleMenu.APINAME_get_menu, this.get_menu.bind(this));
    }

    private async get_menu(app_name: string): Promise<MenuElementVO[]> {

        let res: MenuElementVO[] = [];

        let all = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<MenuElementVO>(
            MenuElementVO.API_TYPE_ID,
            null,
            null,
            'app_name',
            [app_name]);
        for (let i in all) {
            let elt = all[i];

            if (!elt.access_policy_name) {
                res.push(elt);
                continue;
            }

            if (ModuleAccessPolicy.getInstance().checkAccess(elt.access_policy_name)) {
                res.push(elt);
            }
        }

        return res;
    }
}