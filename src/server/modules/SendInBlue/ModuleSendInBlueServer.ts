import moment from 'moment';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailEventVO from '../../../shared/modules/Mailer/vos/MailEventVO';
import MailVO from '../../../shared/modules/Mailer/vos/MailVO';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import SendInBlueMailEventVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailEventVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import SendInBlueMailServerController from './SendInBlueMailServerController';
import SendInBlueServerController from './SendInBlueServerController';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class ModuleSendInBlueServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSendInBlueServer.instance) {
            ModuleSendInBlueServer.instance = new ModuleSendInBlueServer();
        }
        return ModuleSendInBlueServer.instance;
    }

    private static instance: ModuleSendInBlueServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSendInBlue.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleSendInBlue.APINAME_sendinblue_event_webhook, this.sendinblue_event_webhook.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleSendInBlue.APINAME_sendinblue_refresh_mail_events, this.sendinblue_refresh_mail_events.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'SendInBlue'
        }, 'menu.menuelements.admin.SendInBlueAdminVueModule.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Paramètres'
        }, 'menu.menuelements.admin.SendInBlueVO.___LABEL___'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'API'
        }, 'sendinblue.account.api'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'PARTNER'
        }, 'sendinblue.account.partner'));

        await SendInBlueServerController.getInstance().loadParam();
    }

    /**
     * On définit les droits d'accès du module
     */
    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleSendInBlue.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'SendInBlue'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleSendInBlue.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration de SendInBlue'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    private async sendinblue_refresh_mail_events(mail_id: number) {
        if (!mail_id) {
            ConsoleHandler.error('sendinblue_refresh_mail_events:!mail_id');
            return;
        }

        const mail: MailVO = await query(MailVO.API_TYPE_ID).filter_by_id(mail_id).select_vo<MailVO>();

        if ((!mail) || (!mail.message_id)) {
            ConsoleHandler.error('sendinblue_refresh_mail_events:mail not found or !message_id:' + mail_id);
            return;
        }

        const bdd_events = await query(MailEventVO.API_TYPE_ID).filter_by_num_eq(field_names<MailEventVO>().mail_id, mail.id).select_vos<MailEventVO>();

        const api_res: { events: SendInBlueMailEventVO[] } = await SendInBlueServerController.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_GET,
            SendInBlueMailServerController.PATH_STATS_EVENTS + '?messageId=' + encodeURIComponent(mail.message_id) + '&email=' + mail.email + '&sort=desc');

        if ((!api_res) || (!api_res.events)) {
            return;
        }

        api_res.events.forEach((event) => {
            if (moment.isMoment(event.date)) {
                event.date = event.date.unix();
            }
        });

        for (const i in api_res.events) {
            await this.update_mail_event(mail, api_res.events[i], bdd_events);
        }
    }

    private async sendinblue_event_webhook(event: SendInBlueMailEventVO) {
        ConsoleHandler.log('sendinblue_event_webhook:log param:' + JSON.stringify(event));

        event.date = event['ts_event'];
        event.messageId = event.messageId ? event.messageId : event["message-id"];

        if ((!event) || (!event.messageId)) {
            ConsoleHandler.error('sendinblue_event_webhook:bad param:' + JSON.stringify(event));
            return;
        }

        // Contexte serveur pour la suite

        const mails: MailVO[] = await query(MailVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<MailVO>().message_id, event.messageId)
            .filter_by_text_eq(field_names<MailVO>().email, event.email)
            .exec_as_server()
            .select_vos<MailVO>();

        if ((!mails) || (!mails.length)) {
            // il s'avère que SendInBlue envoie en masse tous les projets on peut pas scinder au sein d'un compte, donc
            //  on log pas systématiquement quand on trouve pas le mail, c'est souvent normal
            // ConsoleHandler.error('sendinblue_event_webhook:mail not found:' + JSON.stringify(event));
            return;
        }

        const mail = mails[0];

        if (!mail) {
            ConsoleHandler.error('sendinblue_event_webhook:mail not found:' + JSON.stringify(event));
            return;
        }

        const bdd_events = await query(MailEventVO.API_TYPE_ID).filter_by_num_eq(field_names<MailEventVO>().mail_id, mail.id).exec_as_server().select_vos<MailEventVO>();

        await this.update_mail_event(mail, event, bdd_events);
    }

    private async update_mail_event(mail: MailVO, event: SendInBlueMailEventVO, bdd_events: MailEventVO[]) {
        const new_event = new MailEventVO();

        switch (event.event) {
            case 'request':
            case 'requests':
                new_event.event = MailEventVO.EVENT_Envoye;
                break;
            case 'delivered':
                new_event.event = MailEventVO.EVENT_Delivre;
                break;
            case 'unique_opened':
            case 'opened':
                new_event.event = MailEventVO.EVENT_Ouverture;
                break;
            case 'click':
            case 'clicks':
                new_event.event = MailEventVO.EVENT_Clic;
                break;
            case 'soft_bounce':
            case 'soft_bounces':
            case 'softBounces':
                new_event.event = MailEventVO.EVENT_Soft_bounce;
                break;
            case 'hard_bounce':
            case 'hard_bounces':
            case 'hardBounces':
                new_event.event = MailEventVO.EVENT_Hard_bounce;
                break;
            case 'invalid_email':
            case 'invalid':
                new_event.event = MailEventVO.EVENT_Email_invalide;
                break;
            case 'error':
                new_event.event = MailEventVO.EVENT_Error;
                break;
            case 'deferred':
                new_event.event = MailEventVO.EVENT_Differe;
                break;
            case 'spam':
                new_event.event = MailEventVO.EVENT_Plainte;
                break;
            case 'unsubscribed':
                new_event.event = MailEventVO.EVENT_Desinscrit;
                break;
            case 'blocked':
                new_event.event = MailEventVO.EVENT_Bloque;
                break;
            case 'proxy_open':
            default:
                // Type d'évènement non utilisé
                return;
        }

        new_event.event_date = event.date;
        new_event.mail_id = mail.id;
        new_event.reason = event.reason;

        /**
         * On commence par chercher l'event équivalent en base, si on a déjà on insère pas à nouveau
         */
        let found = false;

        for (const i in bdd_events) {
            const bdd_event = bdd_events[i];

            if ((bdd_event.event == new_event.event) &&
                (bdd_event.event_date == new_event.event_date) &&
                (bdd_event.reason == new_event.reason)) {
                found = true;
                break;
            }
        }

        if (!found) {
            ConsoleHandler.log('sendinblue:new event:' + JSON.stringify(event));

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_event);
        }
    }
}