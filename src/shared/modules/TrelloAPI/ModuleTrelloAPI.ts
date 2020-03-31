import Module from '../Module';

export default class ModuleTrelloAPI extends Module {

    public static MODULE_NAME: string = 'TrelloAPI';

    public static getInstance(): ModuleTrelloAPI {
        if (!ModuleTrelloAPI.instance) {
            ModuleTrelloAPI.instance = new ModuleTrelloAPI();
        }
        return ModuleTrelloAPI.instance;
    }

    private static instance: ModuleTrelloAPI = null;

    private constructor() {
        super("trelloapi", ModuleTrelloAPI.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}