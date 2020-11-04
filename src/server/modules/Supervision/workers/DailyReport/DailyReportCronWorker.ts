import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import TeamsWebhookContentSectionVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentSectionVO';
import TeamsWebhookContentVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../../../env/ConfigurationService';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import SendInBlueMailServerController from '../../../SendInBlue/SendInBlueMailServerController';
import ModuleTeamsAPIServer from '../../../TeamsAPI/ModuleTeamsAPIServer';

export default class DailyReportCronWorker implements ICronWorker {

    public static TEAMS_WEBHOOK_PARAM_NAME: string = 'DailyReportCronWorker.TEAMS_WEBHOOK';
    public static SENDINBLUE_TEMPLATEID_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TEMPLATEID';
    public static SENDINBLUE_TOMAIL_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TOMAIL';
    public static SENDINBLUE_TONAME_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TONAME';

    public static getInstance() {
        if (!DailyReportCronWorker.instance) {
            DailyReportCronWorker.instance = new DailyReportCronWorker();
        }
        return DailyReportCronWorker.instance;
    }

    private static instance: DailyReportCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "DailyReportCronWorker";
    }

    public async work() {
        /**
         * On génère les infos pour le rapport et ensuite on tente de l'envoyer à qui veut (Teams, mail *TODO*, logs, ...)
         *  suivant les paramètres de l'application
         */
        // On commence par récupérer toutes les sondes et catégories
        let category_by_ids: { [id: number]: SupervisedCategoryVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(
            await ModuleDAO.getInstance().getVos<SupervisedCategoryVO>(SupervisedCategoryVO.API_TYPE_ID)
        );
        let supervised_items_by_names: { [name: string]: ISupervisedItem } = await this.load_supervised_items(category_by_ids);
        let ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] } = this.get_ordered_supervised_items_by_state(supervised_items_by_names);

        // En suite on décide d'envoyer là où on a une conf valide
        await this.send_teams(ordered_supervised_items_by_state);
        await this.send_mail(ordered_supervised_items_by_state);

        // Dans tous les cas on log le résultat
        this.log(ordered_supervised_items_by_state);
    }

    private async send_teams(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {
        let TEAMS_WEBHOOK_PARAM_NAME: string = await ModuleParams.getInstance().getParamValue(DailyReportCronWorker.TEAMS_WEBHOOK_PARAM_NAME);

        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {
            return;
        }

        if (!!TEAMS_WEBHOOK_PARAM_NAME) {
            let message: TeamsWebhookContentVO = new TeamsWebhookContentVO();

            message.title = "Bilan quotidien - Supervision";
            message.summary = "Bilan quotidien de supervision de l'application";

            message.sections.push(new TeamsWebhookContentSectionVO().set_text("<blockquote>Erreurs : " +
                ((ordered_supervised_items_by_state[SupervisionController.STATE_ERROR] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR].length : 0) +
                    (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ].length : 0))
                + " dont " +
                (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR].length : 0)
                + " non lues</blockquote>"));

            let log_errors: string = this.get_log_for_teams(ordered_supervised_items_by_state[SupervisionController.STATE_ERROR]);
            if (!!log_errors) {
                message.sections.push(new TeamsWebhookContentSectionVO().set_text(log_errors));
            }

            message.sections.push(new TeamsWebhookContentSectionVO().set_text("<blockquote>Warnings : " +
                ((ordered_supervised_items_by_state[SupervisionController.STATE_WARN] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN].length : 0) +
                    (ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ].length : 0))
                + " dont " +
                (ordered_supervised_items_by_state[SupervisionController.STATE_WARN] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN].length : 0)
                + " non lus</blockquote>"));

            let log_warnings: string = this.get_log_for_teams(ordered_supervised_items_by_state[SupervisionController.STATE_WARN]);
            if (!!log_warnings) {
                message.sections.push(new TeamsWebhookContentSectionVO().set_text(log_warnings));
            }

            message.sections.push(new TeamsWebhookContentSectionVO().set_text("<blockquote>OK : " +
                (ordered_supervised_items_by_state[SupervisionController.STATE_OK] ? ordered_supervised_items_by_state[SupervisionController.STATE_OK].length : 0)
                + " - En pause : " +
                (ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED] ? ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED].length : 0)
                + " - Inconnus : " +
                (ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN] ? ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN].length : 0)
                + "</blockquote>"));

            await ModuleTeamsAPIServer.getInstance().send_to_teams_webhook(TEAMS_WEBHOOK_PARAM_NAME, message);
        } else {
            ConsoleHandler.getInstance().log('Envoi du Daily Report de Supervision ignoré pour Teams, le paramètre requis n\'est pas initialisé :' + DailyReportCronWorker.TEAMS_WEBHOOK_PARAM_NAME + ':');
        }
    }

    private get_log_for_teams(ordered_supervised_items: ISupervisedItem[]): string {

        let log_errors: string = null;
        for (let i in ordered_supervised_items) {
            let supervised_item = ordered_supervised_items[i];

            if (!log_errors) {
                log_errors = '<ul>';
            }
            log_errors += '<li><a href=\"' + ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + 'admin/#/supervision/item/' + supervised_item._type + '/' + supervised_item.id + '\">' + supervised_item.name + '</a></li>';
        }

        if (!!log_errors) {
            log_errors += '</ul>';
        }
        return log_errors;
    }

    private async send_mail(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {

        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {
            return;
        }

        let SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValue(DailyReportCronWorker.SENDINBLUE_TEMPLATEID_PARAM_NAME);
        let SEND_IN_BLUE_TEMPLATE_ID: number = SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        let SEND_IN_BLUE_TONAME: string = await ModuleParams.getInstance().getParamValue(DailyReportCronWorker.SENDINBLUE_TONAME_PARAM_NAME);
        let SEND_IN_BLUE_TOMAIL: string = await ModuleParams.getInstance().getParamValue(DailyReportCronWorker.SENDINBLUE_TOMAIL_PARAM_NAME);

        if ((!!SEND_IN_BLUE_TEMPLATE_ID) && (!!SEND_IN_BLUE_TOMAIL) && (!!SEND_IN_BLUE_TONAME)) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
                SendInBlueMailVO.createNew(SEND_IN_BLUE_TONAME, SEND_IN_BLUE_TOMAIL),
                SEND_IN_BLUE_TEMPLATE_ID,
                ['PasswordInitialisation'],
                {
                    ERROR: ordered_supervised_items_by_state[SupervisionController.STATE_ERROR],
                    ERROR_READ: ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ],
                    WARN: ordered_supervised_items_by_state[SupervisionController.STATE_WARN],
                    WARN_READ: ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ],
                    OK: ordered_supervised_items_by_state[SupervisionController.STATE_OK],
                    PAUSED: ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED],
                    UNKOWN: ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN],
                });
        } else {
            ConsoleHandler.getInstance().log('Envoi du Daily Report de Supervision ignoré pour SendInBlue, les 3 paramètres requis ne sont pas initialisés :' + DailyReportCronWorker.SENDINBLUE_TEMPLATEID_PARAM_NAME + ':' + DailyReportCronWorker.SENDINBLUE_TONAME_PARAM_NAME + ':' + DailyReportCronWorker.SENDINBLUE_TOMAIL_PARAM_NAME + ':');
        }
    }

    private log(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {
        ConsoleHandler.getInstance().log(
            'Supervision ' +
            ': Erreur non lue (' + (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR].length : 0) + '): ' +
            ': Erreur lue (' + (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ].length : 0) + '): ' +
            ': Warning non lu (' + (ordered_supervised_items_by_state[SupervisionController.STATE_WARN] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN].length : 0) + '): ' +
            ': Warning lu (' + (ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ].length : 0) + '): ' +
            ': OK (' + (ordered_supervised_items_by_state[SupervisionController.STATE_OK] ? ordered_supervised_items_by_state[SupervisionController.STATE_OK].length : 0) + '): ' +
            ': En pause (' + (ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED] ? ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED].length : 0) + '): ' +
            ': Inconnu (' + (ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN] ? ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN].length : 0) + '):'
        );
    }

    private async load_supervised_items(category_by_ids: { [id: number]: SupervisedCategoryVO }): Promise<{ [name: string]: ISupervisedItem }> {

        let supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
        let promises = [];

        let registered_api_types = SupervisionController.getInstance().registered_controllers;

        for (let api_type_id in registered_api_types) {
            let registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type_id];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            promises.push((async () => {
                let items = await ModuleDAO.getInstance().getVos<ISupervisedItem>(api_type_id);

                for (let i in items) {
                    let item = items[i];

                    // Si on a une catégorie sans notif, on passe au suivant
                    if (item.category_id && category_by_ids[item.category_id] && !category_by_ids[item.category_id].notify) {
                        continue;
                    }

                    supervised_items_by_names[item.name] = item;
                }
            })());
        }

        await Promise.all(promises);

        return supervised_items_by_names;
    }

    private get_ordered_supervised_items_by_state(supervised_items_by_names: { [name: string]: ISupervisedItem }): { [state: number]: ISupervisedItem[] } {

        let ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] } = {};
        for (let i in supervised_items_by_names) {
            let supervised_item = supervised_items_by_names[i];

            if (!ordered_supervised_items_by_state[supervised_item.state]) {
                ordered_supervised_items_by_state[supervised_item.state] = [];
            }
            ordered_supervised_items_by_state[supervised_item.state].push(supervised_item);
        }

        for (let i in ordered_supervised_items_by_state) {
            let ordered_supervised_items = ordered_supervised_items_by_state[i];

            ordered_supervised_items.sort((a: ISupervisedItem, b: ISupervisedItem) => {
                if (a.name < b.name) {
                    return -1;
                }

                if (a.name > b.name) {
                    return 1;
                }

                return 0;
            });
        }

        return ordered_supervised_items_by_state;
    }
}