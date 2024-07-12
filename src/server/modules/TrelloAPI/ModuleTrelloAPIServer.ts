import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleTrelloAPI from '../../../shared/modules/TrelloAPI/ModuleTrelloAPI';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';
import ModuleRequestServer from '../Request/ModuleRequestServer';

export default class ModuleTrelloAPIServer extends ModuleServerBase {

    public static TRELLO_API_KEY_PARAM_NAME: string = 'TRELLO_API_KEY';
    public static TRELLO_TOKEN_PARAM_NAME: string = 'TRELLO_TOKEN';

    // istanbul ignore next: nothing to test : getInstance
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
    /**
     * ----- Local thread cache
     */

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleTrelloAPI.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    public async archive_card(card_id: string): Promise<void> {

        await this.update_card(card_id, {
            closed: true
        });
    }

    public async mv_card_to_list(card_id: string, list_id: string): Promise<void> {

        await this.update_card(card_id, {
            idList: list_id
        });
    }

    public async add_label_to_card(card_id: string, label_id: string): Promise<void> {

        const card = await this.get_card(card_id);

        if (!card) {
            ConsoleHandler.error('No card found for id ' + card_id);
            return;
        }

        const new_labels = [];
        for (const i in card.labels) {
            const card_label = card.labels[i];

            if (card_label.id != label_id) {
                new_labels.push(card_label.id);
            }
        }
        new_labels.push(label_id);

        try {
            await this.update_card(card_id, {
                idLabels: new_labels
            });
        } catch (error) {
            ConsoleHandler.error('Error in add_label_to_card:' + error);
        }
    }

    public async update_card(card_id: string, updates: any): Promise<any> {

        const TRELLO_API_KEY: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_API_KEY_PARAM_NAME, null, 60000);
        const TRELLO_TOKEN: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_TOKEN_PARAM_NAME, null, 60000);

        try {
            const response = await ModuleRequestServer.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_PUT,
                'api.trello.com',
                '/1/cards/' + card_id + '?key=' + TRELLO_API_KEY + '&token=' + TRELLO_TOKEN,
                updates,
                {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json'
                },
                true);

            return response;
        } catch (error) {
            ConsoleHandler.error('Error in update_card:' + error);
        }
    }

    public async create_card(name: string, desc: string, list_id: string, labels: string[] = null, other_card_elts: any = null): Promise<any> {

        const TRELLO_API_KEY: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_API_KEY_PARAM_NAME, null, 60000);
        const TRELLO_TOKEN: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_TOKEN_PARAM_NAME, null, 60000);

        try {
            const post_params = {
                name: name,
                desc: desc,
                idLabels: labels
            };
            if (other_card_elts) {
                Object.assign(post_params, other_card_elts);
            }

            const response = await ModuleRequestServer.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_POST,
                'api.trello.com',
                '/1/cards?idList=' + list_id + '&key=' + TRELLO_API_KEY + '&token=' + TRELLO_TOKEN,
                post_params,
                {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json'
                },
                true);

            return response;
        } catch (error) {
            ConsoleHandler.error('Error in create_card:' + error);
        }
    }

    public async get_card(card_id: string): Promise<any> {

        const TRELLO_API_KEY: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_API_KEY_PARAM_NAME, null, 60000);
        const TRELLO_TOKEN: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_TOKEN_PARAM_NAME, null, 60000);

        try {

            const response = await ModuleRequestServer.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                'api.trello.com',
                '/1/cards/' + card_id + '?key=' + TRELLO_API_KEY + '&token=' + TRELLO_TOKEN,
                null,
                {
                    Accept: 'application/json'
                },
                true);

            return response;
        } catch (error) {
            ConsoleHandler.error('Error in get_card:' + error);
        }
    }

    public async get_label(label_id: string): Promise<any> {

        const TRELLO_API_KEY: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_API_KEY_PARAM_NAME, null, 60000);
        const TRELLO_TOKEN: string = await ModuleParams.getInstance().getParamValueAsString(ModuleTrelloAPIServer.TRELLO_TOKEN_PARAM_NAME, null, 60000);

        try {

            const response = await ModuleRequestServer.getInstance().sendRequestFromApp(
                ModuleRequest.METHOD_GET,
                'api.trello.com',
                '/1/labels/' + label_id + '?key=' + TRELLO_API_KEY + '&token=' + TRELLO_TOKEN,
                null,
                {
                    Accept: 'application/json'
                },
                true);

            return response;
        } catch (error) {
            ConsoleHandler.error('Error in get_label:' + error);
        }
    }
}
