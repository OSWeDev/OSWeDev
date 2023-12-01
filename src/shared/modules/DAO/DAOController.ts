import VOsTypesManager from '../VO/manager/VOsTypesManager';
import ModuleDAO from './ModuleDAO';

export default class DAOController {

    public static getAccessPolicyName(access_type: string, vo_type: string): string {
        if ((!access_type) || (!vo_type)) {
            return null;
        }
        let isModulesParams: boolean = VOsTypesManager.moduleTables_by_voType[vo_type].isModuleParamTable;
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