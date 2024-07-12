import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';

export default class TemplateHandlerServer {

    // istanbul ignore next: nothing to test
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
        template = this.resolveEnvConditions(template);
        template = this.resolveVarConditions(template, vars);
        template = await this.replaceTrads(template, lang_id);
        template = this.replaceEnvParams(template);

        if (vars) {
            template = this.replaceVars(template, vars);
        }

        return template;
    }

    /**
     * Format §§IFENV_ENVPARAMNAME§§then§§else§§
     * Test booleen sur le param, incluant son existence et sa non nullité
     */
    public resolveEnvConditions(template: string): string {
        const regExp = new RegExp('§§IFENV_([^§ ]+)§§([^§]+)§§([^§]+)§§', 'i');
        const env: EnvParam = ConfigurationService.node_configuration;
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];
            varname = varname ? varname.toLowerCase() : varname;
            const then_: string = regexpres[2];
            const else_: string = regexpres[3];

            if (varname && env[varname] && then_ && else_) {
                template = template.replace(regExp, (env[varname] ? then_ : else_));
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }

    /**
     * Format §§IFVAR_VARNAME§§then§§else§§
     * Test booleen sur le param, incluant son existence et sa non nullité
     */
    public resolveVarConditions(template: string, vars: { [name: string]: string }): string {
        const regExp = new RegExp('§§IFVAR_([^§ ]+)§§([^§]*)§§([^§]*)§§', 'i');
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            const varname: string = regexpres[1];
            const then_: string = regexpres[2];
            const else_: string = regexpres[3];

            if (varname) {
                template = template.replace(regExp, (vars && vars[varname] ? then_ : else_));
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }

    public async replaceTrads(template: string, lang_id: number): Promise<string> {

        const regExp = new RegExp('%%TRAD%%([^% ]+)%%', 'i');

        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            const tradname: string = regexpres[1];

            if (!tradname) {
                template = template.replace(regExp, '');
                continue;
            }

            const translatable: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(tradname);

            if (!translatable) {
                template = template.replace(regExp, '');
                continue;
            }

            const translated: TranslationVO = await ModuleTranslation.getInstance().getTranslation(lang_id, translatable.id);

            if (!translated) {
                template = template.replace(regExp, '');
                continue;
            }

            template = template.replace(regExp, translated.translated);
        }

        return template;
    }

    public replaceEnvParams(template: string): string {

        const regExp = new RegExp('%%ENV%%([^% ]+)%%', 'i');
        const env: EnvParam = ConfigurationService.node_configuration;
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            let varname: string = regexpres[1];
            varname = varname ? varname.toLowerCase() : varname;

            if (varname && env[varname]) {
                template = template.replace(regExp, env[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }

    public replaceVars(template: string, vars: { [name: string]: string }): string {

        const regExp = new RegExp('%%VAR%%([^% ]+)%%', 'i');
        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            const varname: string = regexpres[1];

            if (varname && vars[varname]) {
                template = template.replace(regExp, vars[varname]);
            } else {
                template = template.replace(regExp, '');
            }
        }

        return template;
    }
}
