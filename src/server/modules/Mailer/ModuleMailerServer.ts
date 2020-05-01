import * as nodemailer from 'nodemailer';
import { SendMailOptions } from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import ModuleMailer from '../../../shared/modules/Mailer/ModuleMailer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import TemplateHandlerServer from './TemplateHandlerServer';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleServerBase from '../ModuleServerBase';

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

    public async prepareHTML(template: string, lang_id: number, vars: { [name: string]: string } = null): Promise<string> {

        return TemplateHandlerServer.getInstance().prepareHTML(template, lang_id, vars);
    }

    public async sendMail(mailOptions: SendMailOptions): Promise<any> {

        // On check que l'env permet d'envoyer des mails
        if (ConfigurationService.getInstance().getNodeConfiguration().BLOCK_MAIL_DELIVERY) {
            ConsoleHandler.getInstance().warn('Envoi de mails interdit sur cet env: ' + mailOptions.subject);
            return;
        }

        return new Promise((resolve, reject) => {

            mailOptions.from = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_FROM);

            let prefix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_PREFIX);
            let suffix: string = ModuleMailer.getInstance().getParamValue(ModuleMailer.PARAM_NAME_SUBJECT_SUFFIX);
            mailOptions.subject = (prefix ? prefix : '') + mailOptions.subject + (suffix ? suffix : '');

            let mailtransport = nodemailer.createTransport(this.transporter);
            mailtransport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    ConsoleHandler.getInstance().error(error);
                    resolve();
                } else {
                    ConsoleHandler.getInstance().log('Message sent: ' + info.messageId);
                    resolve();
                }
            });
        });
    }
}