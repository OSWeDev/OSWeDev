import nodemailer from 'nodemailer';
import { SendMailOptions } from 'nodemailer';
import { Address } from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleMailer from '../../../shared/modules/Mailer/ModuleMailer';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TypesHandler from '../../../shared/tools/TypesHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleServerBase from '../ModuleServerBase';
import TemplateHandlerServer from './TemplateHandlerServer';

export default class ModuleMailerServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleMailerServer.instance) {
            ModuleMailerServer.instance = new ModuleMailerServer();
        }
        return ModuleMailerServer.instance;
    }

    private static instance: ModuleMailerServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleMailer.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Initié'
        }, 'mail_event.EVENT_Initie'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Envoyé'
        }, 'mail_event.EVENT_Envoye'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Délivré'
        }, 'mail_event.EVENT_Delivre'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Ouvert'
        }, 'mail_event.EVENT_Ouverture'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Cliqué'
        }, 'mail_event.EVENT_Clic'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur - Soft bounce'
        }, 'mail_event.EVENT_Soft_bounce'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur - Hard bounce'
        }, 'mail_event.EVENT_Hard_bounce'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur - Email invalide'
        }, 'mail_event.EVENT_Email_invalide'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Erreur'
        }, 'mail_event.EVENT_Error'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Différé'
        }, 'mail_event.EVENT_Differe'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dénoncé comme SPAM'
        }, 'mail_event.EVENT_Plainte'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Désinscrit'
        }, 'mail_event.EVENT_Desinscrit'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Bloqué'
        }, 'mail_event.EVENT_Bloque'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mails envoyés par cet utilisateur'
        }, 'fields.labels.ref.module_mailer_mail.___LABEL____sent_by_id'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Mails envoyés à cet utilisateur'
        }, 'fields.labels.ref.module_mailer_mail.___LABEL____sent_to_id'));

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Initialisation du mot de passe'
        }, 'MAILCATEGORY.PasswordInitialisation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Récupération du mot de passe'
        }, 'MAILCATEGORY.PasswordRecovery.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalidation du mot de passe (1/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_RMD1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalidation du mot de passe (2/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_RMD2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Invalidation du mot de passe (3/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_INVALIDATE.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Confirmation du Feedback'
        }, 'MAILCATEGORY.FeedbackConfirmationMail.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Rapport quotidien de supervision'
        }, 'MAILCATEGORY.DailyReportCronWorker.___LABEL___'));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleMailer.APINAME_sendMail, this.sendMail.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleMailer.APINAME_prepareHTML, this.prepareHTML.bind(this));
    }

    public async prepareHTML(template: string, lang_id: number, vars: { [name: string]: string } = null): Promise<string> {
        return TemplateHandlerServer.getInstance().prepareHTML(template, lang_id, vars);
    }

    public async sendMail(mailOptions: SendMailOptions): Promise<any> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.node_configuration.BLOCK_MAIL_DELIVERY) {

            if (this.check_mail_whitelist(mailOptions.to, mailOptions.cc, mailOptions.bcc)) {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + mailOptions.to + ':' + mailOptions.cc + ':' + mailOptions.bcc);

            } else {
                ConsoleHandler.warn('Envoi de mails interdit sur cet env: ' + mailOptions.subject);
                return;
            }
        }

        return new Promise((resolve, reject) => {

            mailOptions.from = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_FROM);

            let prefix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX);
            let suffix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX);
            mailOptions.subject = (prefix ? prefix : '') + mailOptions.subject + (suffix ? suffix : '');

            try {
                let mailtransport = nodemailer.createTransport(this.get_transporter());

                ConsoleHandler.log('Try send mail :to:' + mailOptions.to + ':from:' + mailOptions.from + ':subject:' + mailOptions.subject);

                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        ConsoleHandler.error(error);
                        resolve(error);
                    } else {
                        var log: string = 'Message sent: ' + info.messageId;
                        ConsoleHandler.log(log);
                        resolve(log);
                    }
                });
            } catch (error) {
                ConsoleHandler.error(error);
            }
        });
    }

    /**
     * Returns true if all the adresses are whitelisted
     * @param to
     * @param cc
     * @param bcc
     */
    public check_mail_whitelist(
        to: string | Address | Array<string | Address>,
        cc: string | Address | Array<string | Address>,
        bcc: string | Address | Array<string | Address>): boolean {
        let whitelisted_emails: string[] = ConfigurationService.node_configuration.MAIL_DELIVERY_WHITELIST ?
            ConfigurationService.node_configuration.MAIL_DELIVERY_WHITELIST.split(',') : null;

        if ((!whitelisted_emails) || (!whitelisted_emails.length)) {
            return false;
        }

        return this.check_adresses_whitelist(to, whitelisted_emails) &&
            this.check_adresses_whitelist(cc, whitelisted_emails) &&
            this.check_adresses_whitelist(bcc, whitelisted_emails);
    }

    /**
     * TODO FIXME revoir toute cette logique, pour faire un filtrage par env plutôt que de tout accepter ou refuser...
     * @param address
     * @param whitelisted_emails ne doit pas être null
     */
    private check_adresses_whitelist(
        address: string | Address | Array<string | Address>, whitelisted_emails: string[]): boolean {

        if (!address) {
            return true;
        }

        if (TypesHandler.getInstance().isString(address)) {
            if ((address as string).indexOf(',') >= 0) {
                let addresses = (address as string).split(',');
                for (let i in addresses) {
                    let e = addresses[i];

                    if (!this.check_adresses_whitelist(e, whitelisted_emails)) {
                        return false;
                    }
                }

                return true;
            }

            return whitelisted_emails.indexOf(address as string) >= 0;
        }

        if (TypesHandler.getInstance().isArray(address)) {
            for (let i in address as Array<string | Address>) {
                let e = address[i];

                if (!this.check_adresses_whitelist(e, whitelisted_emails)) {
                    return false;
                }
            }

            return true;
        }

        let address_ = address as Address;
        return whitelisted_emails.indexOf(address_.address) >= 0;
    }

    private get_transporter() {
        let user: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_USER);
        let pass: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_PASS);
        if (user && (user != '') && pass && (pass != '')) {
            return new SMTPTransport({
                host: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_HOST),
                port: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_PORT),
                secure: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SECURE),
                auth: {
                    user: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_USER),
                    pass: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_PASS),
                }
            });
        }

        return new SMTPTransport({
            host: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_HOST),
            port: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_PORT),
            secure: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SECURE)
        });
    }
}