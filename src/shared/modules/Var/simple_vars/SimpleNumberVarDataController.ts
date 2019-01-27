import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';


export default class SimpleNumberVarDataController {

    public static getInstance(): SimpleNumberVarDataController {
        if (!SimpleNumberVarDataController.instance) {
            SimpleNumberVarDataController.instance = new SimpleNumberVarDataController();
        }
        return SimpleNumberVarDataController.instance;
    }

    private static instance: SimpleNumberVarDataController = null;

    protected constructor() {
    }

    public getValueOrDefault(var_data: ISimpleNumberVarData, default_val: number = 0): number {
        return (var_data && (var_data.value != null) && (typeof var_data.value != 'undefined')) ? var_data.value : default_val;
    }
}