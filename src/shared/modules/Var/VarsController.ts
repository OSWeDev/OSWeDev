import ModuleVar from './ModuleVar';

export default class VarsController {


    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static instance: VarsController = null;

    public var_id_by_names: { [var_name: string]: number } = {};

    protected constructor() {
    }

    public async initialize() {
        let res = await ModuleVar.getInstance().get_var_id_by_names();
        this.var_id_by_names = res ? res.var_id_by_names : {};
    }
}