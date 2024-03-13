import ModuleDAO from './ModuleDAO';
import ModuleTableController from './ModuleTableController';

export default class DAOController {

    public static getAccessPolicyName(access_type: string, vo_type: string): string {
        if ((!access_type) || (!vo_type)) {
            return null;
        }
        const isModulesParams: boolean = ModuleTableController.module_tables_by_vo_type[vo_type].is_module_param_table;
        return (isModulesParams ? ModuleDAO.POLICY_GROUP_MODULES_CONF : ModuleDAO.POLICY_GROUP_DATAS) + '.' + access_type + "." + vo_type;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DAOController.instance) {
            DAOController.instance = new DAOController();
        }
        return DAOController.instance;
    }

    private static instance: DAOController = null;
}