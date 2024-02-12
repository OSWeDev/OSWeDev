import Module from '../Module';

export default class ModuleTeamsAPI extends Module {

    public static MODULE_NAME: string = 'TeamsAPI';

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleTeamsAPI {
        if (!ModuleTeamsAPI.instance) {
            ModuleTeamsAPI.instance = new ModuleTeamsAPI();
        }
        return ModuleTeamsAPI.instance;
    }

    private static instance: ModuleTeamsAPI = null;

    private constructor() {
        super("teamsapi", ModuleTeamsAPI.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}