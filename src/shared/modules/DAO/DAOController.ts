import ModuleDAO from './ModuleDAO';

export default class DAOController {

    private static instance: DAOController = null;

    public static getAccessPolicyName(access_type: string, vo_type: string): string {
        if ((!access_type) || (!vo_type)) {
            return null;
        }
        return ModuleDAO.POLICY_GROUP_DATAS + '.' + access_type + "." + vo_type;
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DAOController.instance) {
            DAOController.instance = new DAOController();
        }
        return DAOController.instance;
    }
}