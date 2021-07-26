import Module from '../Module';

export default class ModuleAPI extends Module {

    public static getInstance(): ModuleAPI {
        if (!ModuleAPI.instance) {
            ModuleAPI.instance = new ModuleAPI();
        }
        return ModuleAPI.instance;
    }


    private static instance: ModuleAPI = null;

    private constructor() {

        super("api", "API");
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}