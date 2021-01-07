import * as nodemailer from 'nodemailer';
import { SendMailOptions } from 'nodemailer';
import { Address } from 'nodemailer/lib/mailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleMailer from '../../../shared/modules/Mailer/ModuleMailer';
import PrepareHTMLParamVO from '../../../shared/modules/Mailer/vos/PrepareHTMLParamVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TypesHandler from '../../../shared/tools/TypesHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleServerBase from '../ModuleServerBase';
import TemplateHandlerServer from './TemplateHandlerServer';


export default class ModuleMailerServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMailerServer.instance) {
            ModuleMailerServer.instance = new ModuleMailerServer();
        }
        return ModuleMailerServer.instance;
    }

    private static instance: ModuleMailerServer = null;

    /**
     * Local thread cache -----
     */
    private transporter: SMTPTransport;
    /**
     * ----- Local thread cache
     */

    private constructor() {
        super(ModuleMailer.getInstance().name);

        let user: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_USER);
        let pass: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_PASS);
        if (user && (user != '') && pass && (pass != '')) {
            this.transporter = new SMTPTransport({
                host: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_HOST),
                port: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_PORT),
                secure: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SECURE),
                auth: {
                    user: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_USER),
                    pass: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_AUTH_PASS),
                }
            });
        } else {
            this.transporter = new SMTPTransport({
                host: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_HOST),
                port: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_PORT),
                secure: ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SECURE)
            });
        }
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMailer.APINAME_sendMail, this.sendMail.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleMailer.APINAME_prepareHTML, this.prepareHTMLAPI.bind(this));
    }

    public async prepareHTMLAPI(param: PrepareHTMLParamVO): Promise<string> {

        let template: string = param.template;
        let lang_id: number = param.lang_id;
        let vars: { [name: string]: string } = param.vars;

        return this.prepareHTML(template, lang_id, vars);
    }

    public async prepareHTML(template: string, lang_id: number, vars: { [name: string]: string } = null): Promise<string> {

        return TemplateHandlerServer.getInstance().prepareHTML(template, lang_id, vars);
    }

    public async sendMail(mailOptions: SendMailOptions): Promise<any> {

        // On check que l'env permet d'envoyer des mails
        // On vérifie la whitelist
        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {

            if (this.check_mail_whitelist(mailOptions.to, mailOptions.cc, mailOptions.bcc)) {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env mais adresses whitelistées:' + mailOptions.to + ':' + mailOptions.cc + ':' + mailOptions.bcc);

            } else {
                ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env: ' + mailOptions.subject);
                return;
            }
        }

        return new Promise((resolve, reject) => {

            mailOptions.from = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_FROM);

            let prefix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX);
            let suffix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX);
            mailOptions.subject = (prefix ? prefix : '') + mailOptions.subject + (suffix ? suffix : '');

            try {
                let mailtransport = nodemailer.createTransport(this.transporter);

                ConsoleHandler.getInstance().log('Try send mail :to:' + mailOptions.to + ':from:' + mailOptions.from + ':subject:' + mailOptions.subject);

                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        ConsoleHandler.getInstance().error(error);
                        resolve();
                    } else {
                        ConsoleHandler.getInstance().log('Message sent: ' + info.messageId);
                        resolve();
                    }
                });
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
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
        let whitelisted_emails: string[] = ConfigurationService.getInstance().getNodeConfiguration().MAIL_DELIVERY_WHITELIST ?
            ConfigurationService.getInstance().getNodeConfiguration().MAIL_DELIVERY_WHITELIST.split(',') : null;

        if ((!whitelisted_emails) || (!whitelisted_emails.length)) {
            return false;
        }

        return this.check_adresses_whitelist(to, whitelisted_emails) &&
            this.check_adresses_whitelist(cc, whitelisted_emails) &&
            this.check_adresses_whitelist(bcc, whitelisted_emails);
    }

    /**
     *
     * @param address
     * @param whitelisted_emails ne doit pas être null
     */
    private check_adresses_whitelist(
        address: string | Address | Array<string | Address>, whitelisted_emails: string[]): boolean {

        if (!address) {
            return true;
        }

        if (TypesHandler.getInstance().isString(address)) {
            return whitelisted_emails.indexOf(address as string) >= 0;
        }

        if (TypesHandler.getInstance().isArray(address)) {
            for (let i in address as Array<string | Address>) {
                let e = address[i];

                if (!this.check_adresses_whitelist(address, whitelisted_emails)) {
                    return false;
                }
            }

            return true;
        }

        let address_ = address as Address;
        return whitelisted_emails.indexOf(address_.address) >= 0;
    }
}