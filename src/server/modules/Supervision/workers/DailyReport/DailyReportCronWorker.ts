import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import TeamsWebhookContentAdaptiveCardVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentColumnSetVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnSetVO';
import TeamsWebhookContentColumnVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnVO';
import TeamsWebhookContentTextBlockVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
import TeamsWebhookContentVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ConfigurationService from '../../../../env/ConfigurationService';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import SendInBlueMailServerController from '../../../SendInBlue/SendInBlueMailServerController';
import TeamsAPIServerController from '../../../TeamsAPI/TeamsAPIServerController';

export default class DailyReportCronWorker implements ICronWorker {

    public static TEAMS_GROUPID_PARAM_NAME: string = 'DailyReportCronWorker.TEAMS_GROUPID';
    public static TEAMS_CHANNELID_PARAM_NAME: string = 'DailyReportCronWorker.TEAMS_CHANNELID';

    public static SENDINBLUE_TEMPLATEID_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TEMPLATEID';
    public static SENDINBLUE_TOMAIL_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TOMAIL';
    public static SENDINBLUE_TONAME_PARAM_NAME: string = 'DailyReportCronWorker.SENDINBLUE_TONAME';

    public static MAILCATEGORY_DailyReportCronWorker = 'MAILCATEGORY.DailyReportCronWorker';

    private static instance: DailyReportCronWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "DailyReportCronWorker";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DailyReportCronWorker.instance) {
            DailyReportCronWorker.instance = new DailyReportCronWorker();
        }
        return DailyReportCronWorker.instance;
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        /**
         * On génère les infos pour le rapport et ensuite on tente de l'envoyer à qui veut (Teams, mail *TODO*, logs, ...)
         *  suivant les paramètres de l'application
         */
        // On commence par récupérer toutes les sondes et catégories
        const category_by_ids: { [id: number]: SupervisedCategoryVO } = VOsTypesManager.vosArray_to_vosByIds(
            await query(SupervisedCategoryVO.API_TYPE_ID).select_vos<SupervisedCategoryVO>()
        );
        const supervised_items_by_names: { [name: string]: ISupervisedItem } = await this.load_supervised_items(category_by_ids);
        const ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] } = this.get_ordered_supervised_items_by_state(supervised_items_by_names);

        // En suite on décide d'envoyer là où on a une conf valide
        await this.send_teams(ordered_supervised_items_by_state);
        await this.send_mail(ordered_supervised_items_by_state);

        // Dans tous les cas on log le résultat
        this.log(ordered_supervised_items_by_state);
    }

    // istanbul ignore next: nothing to test : send_teams
    private async send_teams(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {
        const group_id: string = await ModuleParams.getInstance().getParamValueAsString(DailyReportCronWorker.TEAMS_GROUPID_PARAM_NAME);
        const channel_id: string = await ModuleParams.getInstance().getParamValueAsString(DailyReportCronWorker.TEAMS_CHANNELID_PARAM_NAME);

        if (!group_id || !channel_id) {
            ConsoleHandler.log('Envoi du Daily Report de Supervision ignoré pour Teams, les 2 paramètres requis ne sont pas initialisés :' + DailyReportCronWorker.TEAMS_GROUPID_PARAM_NAME + ':' + DailyReportCronWorker.TEAMS_CHANNELID_PARAM_NAME + ':');
            return;
        }

        if (ConfigurationService.node_configuration.block_mail_delivery) {
            return;
        }

        const body = [];
        const message: TeamsWebhookContentVO = new TeamsWebhookContentVO();

        let title_Text = new TeamsWebhookContentTextBlockVO().set_text((ConfigurationService.node_configuration.is_main_prod_env ? '[PROD] ' : '[TEST] ') + "Bilan quotidien - Supervision").set_weight("bolder").set_size("large");
        body.push(title_Text);

        let error_Text = new TeamsWebhookContentTextBlockVO().set_text("Erreurs : " +
            ((ordered_supervised_items_by_state[SupervisionController.STATE_ERROR] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR].length : 0) +
                (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR_READ].length : 0))
            + " dont " +
            (ordered_supervised_items_by_state[SupervisionController.STATE_ERROR] ? ordered_supervised_items_by_state[SupervisionController.STATE_ERROR].length : 0)
            + " non lues").set_size("small");
        let error_Column = new TeamsWebhookContentColumnSetVO().set_style("attention").set_columns([new TeamsWebhookContentColumnVO().set_items([error_Text])]);
        body.push(error_Column);

        const log_errors: string = this.get_log_for_teams(ordered_supervised_items_by_state[SupervisionController.STATE_ERROR]);
        if (log_errors) {
            body.push(new TeamsWebhookContentTextBlockVO().set_text(log_errors).set_size("small"));
        }


        let warning_Text = new TeamsWebhookContentTextBlockVO().set_text("Warnings : " +
            ((ordered_supervised_items_by_state[SupervisionController.STATE_WARN] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN].length : 0) +
                (ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN_READ].length : 0))
            + " dont " +
            (ordered_supervised_items_by_state[SupervisionController.STATE_WARN] ? ordered_supervised_items_by_state[SupervisionController.STATE_WARN].length : 0)
            + " non lues").set_size("small");
        let warning_Column = new TeamsWebhookContentColumnSetVO().set_style("warning").set_columns([new TeamsWebhookContentColumnVO().set_items([warning_Text])]);
        body.push(warning_Column);

        const log_warnings: string = this.get_log_for_teams(ordered_supervised_items_by_state[SupervisionController.STATE_WARN]);
        if (log_warnings) {
            body.push(new TeamsWebhookContentTextBlockVO().set_text(log_warnings).set_size("small"));
        }
        let ok_Text = new TeamsWebhookContentTextBlockVO().set_text("OK : " +
            (ordered_supervised_items_by_state[SupervisionController.STATE_OK] ? ordered_supervised_items_by_state[SupervisionController.STATE_OK].length : 0)
            + " - En pause : " +
            (ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED] ? ordered_supervised_items_by_state[SupervisionController.STATE_PAUSED].length : 0)
            + " - Inconnus : " +
            (ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN] ? ordered_supervised_items_by_state[SupervisionController.STATE_UNKOWN].length : 0)
            + "").set_size("small");
        let ok_Column = new TeamsWebhookContentColumnSetVO().set_style("good").set_columns([new TeamsWebhookContentColumnVO().set_items([ok_Text])]);
        body.push(ok_Column);
        message.attachments.push(new TeamsWebhookContentAttachmentsVO().set_name("Daily Report").set_content(new TeamsWebhookContentAdaptiveCardVO().set_body(body)));
        await TeamsAPIServerController.send_to_teams_webhook(channel_id, group_id, message);
    }

    private get_log_for_teams(ordered_supervised_items: ISupervisedItem[]): string {
        let log_errors: string = null;
        const log_errors_max = 10;
        let log_errors_remaining = log_errors_max;

        for (const i in ordered_supervised_items) {
            const supervised_item = ordered_supervised_items[i];

            if (!log_errors) {
                log_errors = '- ';
            }
            log_errors += '- [' + supervised_item.name + '](\"' + ConfigurationService.node_configuration.base_url + 'admin/#/supervision/dashboard/item/' + supervised_item._type + '/' + supervised_item.id + '\") \r';

            log_errors_remaining--;
            if (!log_errors_remaining) {
                log_errors += '- ... (limit ' + log_errors_max + ') \r';
                break;
            }
        }

        if (log_errors) {
            log_errors += '\r';
        }
        return log_errors;
    }

    private async send_mail(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {

        if (ConfigurationService.node_configuration.block_mail_delivery) {
            return;
        }

        const SEND_IN_BLUE_TEMPLATE_ID_s: string = await ModuleParams.getInstance().getParamValueAsString(DailyReportCronWorker.SENDINBLUE_TEMPLATEID_PARAM_NAME);
        const SEND_IN_BLUE_TEMPLATE_ID: number = SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_IN_BLUE_TEMPLATE_ID_s) : null;

        const SEND_IN_BLUE_TONAME: string = await ModuleParams.getInstance().getParamValueAsString(DailyReportCronWorker.SENDINBLUE_TONAME_PARAM_NAME);
        const SEND_IN_BLUE_TOMAIL: string = await ModuleParams.getInstance().getParamValueAsString(DailyReportCronWorker.SENDINBLUE_TOMAIL_PARAM_NAME);

        if ((!!SEND_IN_BLUE_TEMPLATE_ID) && (!!SEND_IN_BLUE_TOMAIL) && (!!SEND_IN_BLUE_TONAME)) {

            // Using SendInBlue
            await SendInBlueMailServerController.getInstance().sendWithTemplate(
                DailyReportCronWorker.MAILCATEGORY_DailyReportCronWorker,
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
            ConsoleHandler.log('Envoi du Daily Report de Supervision ignoré pour SendInBlue, les 3 paramètres requis ne sont pas initialisés :' + DailyReportCronWorker.SENDINBLUE_TEMPLATEID_PARAM_NAME + ':' + DailyReportCronWorker.SENDINBLUE_TONAME_PARAM_NAME + ':' + DailyReportCronWorker.SENDINBLUE_TOMAIL_PARAM_NAME + ':');
        }
    }

    private log(ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] }) {
        ConsoleHandler.log(
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

        const supervised_items_by_names: { [name: string]: ISupervisedItem } = {};
        const promises = [];

        const registered_api_types = SupervisionController.getInstance().registered_controllers;

        for (const api_type_id in registered_api_types) {
            const registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type_id];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            promises.push((async () => {
                const items = await query(api_type_id).select_vos<ISupervisedItem>();

                for (const i in items) {
                    const item = items[i];

                    // Si on a une catégorie sans notif, on passe au suivant
                    if (item.category_id && category_by_ids[item.category_id] && !category_by_ids[item.category_id].notify) {
                        continue;
                    }

                    supervised_items_by_names[item.name] = item;
                }
            })());
        }

        await all_promises(promises);

        return supervised_items_by_names;
    }

    private get_ordered_supervised_items_by_state(supervised_items_by_names: { [name: string]: ISupervisedItem }): { [state: number]: ISupervisedItem[] } {

        const ordered_supervised_items_by_state: { [state: number]: ISupervisedItem[] } = {};
        for (const i in supervised_items_by_names) {
            const supervised_item = supervised_items_by_names[i];

            if (!ordered_supervised_items_by_state[supervised_item.state]) {
                ordered_supervised_items_by_state[supervised_item.state] = [];
            }
            ordered_supervised_items_by_state[supervised_item.state].push(supervised_item);
        }

        for (const i in ordered_supervised_items_by_state) {
            const ordered_supervised_items = ordered_supervised_items_by_state[i];

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