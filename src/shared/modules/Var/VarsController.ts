import ModuleVar from './ModuleVar';
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
     * La correspondance des noms de vars vers les ids, pour garder des indexs compacts
     */
    public var_id_by_names: { [name: string]: number } = {};

    /**
     * La correspondance des ids vers les noms de vars, pour récupérer les trads par exemple
     */
    public var_names_by_ids: { [var_id: number]: string } = {};

    protected constructor() {
    }

    public async initialize() {
        let res = await ModuleVar.getInstance().get_var_id_by_names();
        if (res) {
            this.var_id_by_names = res ? res.var_id_by_names : {};
            for (let name in res) {
                let id = res[name];
                this.var_names_by_ids[id] = name;
            }
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