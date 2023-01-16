import * as TrelloNodeApi from 'oswedev-trello-node-api';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleTrelloAPI from '../../../shared/modules/TrelloAPI/ModuleTrelloAPI';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleTrelloAPIServer extends ModuleServerBase {

    public static TRELLO_API_KEY_PARAM_NAME: string = 'TRELLO_API_KEY';
    public static TRELLO_TOKEN_PARAM_NAME: string = 'TRELLO_TOKEN';

    public static getInstance() {
        if (!ModuleTrelloAPIServer.instance) {
            ModuleTrelloAPIServer.instance = new ModuleTrelloAPIServer();
        }
        return ModuleTrelloAPIServer.instance;
    }

    private static instance: ModuleTrelloAPIServer = null;

    /**
     * Local thread cache -----
     */
    private trello: TrelloNodeApi = null;
    /**
     * ----- Local thread cache
     */

    private constructor() {
        super(ModuleTrelloAPI.getInstance().name);
    }

    public async configure() {
    }

    public async getTrelloAPI(): Promise<TrelloNodeApi> {

        if (!!this.trello) {
            return this.trello;
        }

        let TRELLO_API_KEY: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_API_KEY_PARAM_NAME);
        let TRELLO_TOKEN: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_TOKEN_PARAM_NAME);

        if ((!!TRELLO_API_KEY) && (!!TRELLO_TOKEN)) {
            this.trello = new TrelloNodeApi();
            this.trello.setApiKey(TRELLO_API_KEY);
            this.trello.setOauthToken(TRELLO_TOKEN);
        } else {
            throw new Error('getTrelloAPI needs TRELLO_API_KEY and TRELLO_TOKEN to be set');
        }

        return this.trello;
    }
}