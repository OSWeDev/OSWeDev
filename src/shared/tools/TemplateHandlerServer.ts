import ConfigurationService from '../../server/env/ConfigurationService';
import EnvParam from '../../server/env/EnvParam';
import TranslatableTextVO from '../modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../modules/Translation/vos/TranslationVO';
import ModuleTranslation from '../modules/Translation/ModuleTranslation';

export default class TemplateHandlerServer {

    public static getInstance(): TemplateHandlerServer {
        if (!TemplateHandlerServer.instance) {
            TemplateHandlerServer.instance = new TemplateHandlerServer();
        }
        return TemplateHandlerServer.instance;
    }

    private static instance: TemplateHandlerServer = null;

    private constructor() {
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

    public async replaceTrads(template: string, lang_id: number): Promise<string> {

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

    public replaceEnvParams(template: string): string {

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

    public replaceVars(template: string, vars: { [name: string]: string }): string {

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
