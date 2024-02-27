import nodemailer, { SendMailOptions } from 'nodemailer';
import { Address } from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleMailer from '../../../shared/modules/Mailer/ModuleMailer';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
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
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Initié'
        }, 'mail_event.EVENT_Initie'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Envoyé'
        }, 'mail_event.EVENT_Envoye'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Délivré'
        }, 'mail_event.EVENT_Delivre'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Ouvert'
        }, 'mail_event.EVENT_Ouverture'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Cliqué'
        }, 'mail_event.EVENT_Clic'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur - Soft bounce'
        }, 'mail_event.EVENT_Soft_bounce'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur - Hard bounce'
        }, 'mail_event.EVENT_Hard_bounce'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur - Email invalide'
        }, 'mail_event.EVENT_Email_invalide'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Erreur'
        }, 'mail_event.EVENT_Error'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Différé'
        }, 'mail_event.EVENT_Differe'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Dénoncé comme SPAM'
        }, 'mail_event.EVENT_Plainte'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Désinscrit'
        }, 'mail_event.EVENT_Desinscrit'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Bloqué'
        }, 'mail_event.EVENT_Bloque'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mails envoyés par cet utilisateur'
        }, 'fields.labels.ref.module_mailer_mail.___LABEL____sent_by_id'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mails envoyés à cet utilisateur'
        }, 'fields.labels.ref.module_mailer_mail.___LABEL____sent_to_id'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Initialisation du mot de passe'
        }, 'MAILCATEGORY.PasswordInitialisation.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Récupération du mot de passe'
        }, 'MAILCATEGORY.PasswordRecovery.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalidation du mot de passe (1/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_RMD1.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalidation du mot de passe (2/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_RMD2.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Invalidation du mot de passe (3/3)'
        }, 'MAILCATEGORY.PasswordInvalidation_INVALIDATE.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Confirmation du Feedback'
        }, 'MAILCATEGORY.FeedbackConfirmationMail.___LABEL___'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
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

        return new Promise(async (resolve, reject) => {

            let prefix: string = null;
            let suffix: string = null;
            await all_promises([
                (async () => {
                    mailOptions.from = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_FROM, ModuleMailer.DEFAULT_FROM, 1000 * 60 * 5); // 5 minutes
                })(),
                (async () => {
                    prefix = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX, ModuleMailer.DEFAULT_SUBJECT_PREFIX, 1000 * 60 * 5); // 5 minutes
                })(),
                (async () => {
                    suffix = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX, ModuleMailer.DEFAULT_SUBJECT_SUFFIX, 1000 * 60 * 5); // 5 minutes
                })()
            ]);

            mailOptions.subject = (prefix ? prefix : '') + mailOptions.subject + (suffix ? suffix : '');

            try {
                const mailtransport = await nodemailer.createTransport(this.get_transporter());

                ConsoleHandler.log('Try send mail :to:' + mailOptions.to + ':from:' + mailOptions.from + ':subject:' + mailOptions.subject);

                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        ConsoleHandler.error(error);
                        resolve(error);
                    } else {
                        const log: string = 'Message sent: ' + info.messageId;
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
        const whitelisted_emails: string[] = ConfigurationService.node_configuration.MAIL_DELIVERY_WHITELIST ?
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
                const addresses = (address as string).split(',');
                for (const i in addresses) {
                    const e = addresses[i];

                    if (!this.check_adresses_whitelist(e, whitelisted_emails)) {
                        return false;
                    }
                }

                return true;
            }

            return whitelisted_emails.indexOf(address as string) >= 0;
        }

        if (TypesHandler.getInstance().isArray(address)) {
            for (const i in address as Array<string | Address>) {
                const e = address[i];

                if (!this.check_adresses_whitelist(e, whitelisted_emails)) {
                    return false;
                }
            }

            return true;
        }

        const address_ = address as Address;
        return whitelisted_emails.indexOf(address_.address) >= 0;
    }

    private async get_transporter() {

        let user: string = null;
        let pass: string = null;
        let host: string = null;
        let port: number = null;
        let secure: boolean = null;
        await all_promises([
            (async () => {
                user = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_AUTH_USER, ModuleMailer.DEFAULT_AUTH_USER, 1000 * 60 * 5); // 5 minutes
            })(),
            (async () => {
                pass = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_AUTH_PASS, ModuleMailer.DEFAULT_AUTH_PASS, 1000 * 60 * 5); // 5 minutes
            })(),
            (async () => {
                host = await ModuleParams.getInstance().getParamValueAsString(ModuleMailer.PARAM_NAME_HOST, ModuleMailer.DEFAULT_HOST, 1000 * 60 * 5); // 5 minutes
            })(),
            (async () => {
                port = await ModuleParams.getInstance().getParamValueAsInt(ModuleMailer.PARAM_NAME_PORT, ModuleMailer.DEFAULT_PORT, 1000 * 60 * 5); // 5 minutes
            })(),
            (async () => {
                secure = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleMailer.PARAM_NAME_SECURE, ModuleMailer.DEFAULT_SECURE, 1000 * 60 * 5); // 5 minutes
            })()
        ]);

        if (user && (user != '') && pass && (pass != '')) {
            return new SMTPTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass
                }
            });
        }

        return new SMTPTransport({
            host,
            port,
            secure
        });
    }
}