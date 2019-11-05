import * as nodemailer from 'nodemailer';
import { SendMailOptions } from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import ModuleMailer from '../../../shared/modules/Mailer/ModuleMailer';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleMailerServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleMailerServer.instance) {
            ModuleMailerServer.instance = new ModuleMailerServer();
        }
        return ModuleMailerServer.instance;
    }

    private static instance: ModuleMailerServer = null;

    private transporter: SMTPTransport;

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

        // Les trads peuvent contenir des envs params
        template = await this.replaceTrads(template, lang_id);
        template = this.replaceEnvParams(template);

        if (vars) {
            template = this.replaceVars(template, vars);
        }

        return template;
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

    private async replaceTrads(template: string, lang_id: number): Promise<string> {

        let regExp = new RegExp('%%TRAD%%([^% ]+)%%', 'i');

        while (regExp.test(template)) {
            let regexpres: string[] = regExp.exec(template);
            let tradname: string = regexpres[1];

            if (!tradname) {
                template = template.replace(regExp, '');
                continue;
            }

            let translatable: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(tradname);

            if (!translatable) {
                template = template.replace(regExp, '');
                continue;
            }

            let translated: TranslationVO = await ModuleTranslation.getInstance().getTranslation(lang_id, translatable.id);

            if (!translated) {
                template = template.replace(regExp, '');
                continue;
            }

            template = template.replace(regExp, translated.translated);
        }

        return template;
    }

    private replaceEnvParams(template: string): string {

        let regExp = new RegExp('%%ENV%%([^% ]+)%%', 'i');
        let env: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();
        while (regExp.test(template)) {
            let regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];

            if (varname && env[varname]) {
                template = template.replace(regExp, env[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }

    private replaceVars(template: string, vars: { [name: string]: string }): string {

        let regExp = new RegExp('%%VAR%%([^% ]+)%%', 'i');
        while (regExp.test(template)) {
            let regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];

            if (varname && vars[varname]) {
                template = template.replace(regExp, vars[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }
}