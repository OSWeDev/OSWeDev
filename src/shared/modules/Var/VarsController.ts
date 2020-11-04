import ModuleDAO from '../DAO/ModuleDAO';
import VOsTypesManager from '../VOsTypesManager';
import VarConfVO from './vos/VarConfVO';
import VarDataBaseVO from './vos/VarDataBaseVO';

export default class VarsController {


    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static instance: VarsController = null;

    /**
     * Les confs de var par nom, pour avoir les infos les plus importantes sur les vars partout
     */
    public var_conf_by_name: { [name: string]: VarConfVO } = {};
    public var_conf_by_id: { [var_id: number]: VarConfVO } = {};

    protected constructor() {
    }

    public async initialize(var_conf_by_id: { [var_id: number]: VarConfVO } = null) {
        if (!var_conf_by_id) {
            this.var_conf_by_id = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<VarConfVO>(VarConfVO.API_TYPE_ID));
        } else {
            this.var_conf_by_id = var_conf_by_id;
        }
        for (let i in this.var_conf_by_id) {
            let conf = this.var_conf_by_id[i];
            this.var_conf_by_name[conf.name] = conf;
        }
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
    public isSameParamArray(ps1: VarDataBaseVO[], ps2: VarDataBaseVO[]): boolean {
        ps1 = (!!ps1) ? ps1 : [];
        ps2 = (!!ps2) ? ps2 : [];

        if (ps1.length != ps2.length) {
            return false;
        }

        for (let i in ps1) {
            let p1: VarDataBaseVO = ps1[i];
            let p2: VarDataBaseVO = ps2[i];

            if (p1.index != p2.index) {
                return false;
            }
        }
        return true;
    }
}