import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class TemplateHandlerServer {

    /**
     * Applique un template, et remplace les variables (valeurs et conditions), traductions, et env params (valeurs et conditions)
     * ATTENTION : les envs params sont donc lisibles via ce système, cette fonction ne doit être accessible que par des admins
     * si on est pas asserted_is_server_or_admin on n'a pas le droits aux env params
     * @param template le template à appliquer
     * @param lang_id l'id de la langue à utiliser pour les traductions
     * @param asserted_is_server_or_admin si on est admin ou server, on a le droit de lire les envs params
     * @param template_vars les variables à remplacer / qui peuvent être utilisées dans le template pour des conditions
     * @returns le template appliqué
     */
    public static async apply_template(
        template: string,
        lang_id: number,
        asserted_is_server_or_admin: boolean = false,
        template_vars: { [name: string]: string } = null): Promise<string> {

        template = this.resolveDates(template);

        // Les trads peuvent contenir des envs params
        if (asserted_is_server_or_admin) {
            template = this.resolveEnvConditions(template);
        }

        template = this.resolveVarConditions(template, template_vars);
        template = await this.replaceTrads(template, lang_id);

        if (asserted_is_server_or_admin) {
            template = this.replaceEnvParams(template);
        }

        if (template_vars) {
            template = this.replaceVars(template, template_vars);
        }

        return template;
    }

    /**
     * Format §§DATE_FORMAT§§decalage§§segment_type§§format§§
     * Pour afficher une date formatée, décalée (Dates.add(Dates.now(), decalage, segment_type), au format format
     */
    public static resolveDates(template: string): string {
        const regExp = new RegExp('§§DATE_FORMAT§§([^§ ]+)§§([^§]+)§§([^§]+)§§', 'i');

        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);

            try {
                const decalage: number = parseInt(regexpres[1]);
                const segment_type: number = parseInt(regexpres[2]);
                const format: string = regexpres[3];
                template = template.replace(regExp, Dates.format(Dates.add(Dates.now(), decalage, segment_type), format, true));
                continue;
            } catch (error) {
                ConsoleHandler.error('TemplateHandlerServer.resolveDates error: ' + error);
            }

            template = template.replace(regExp, '');
        }

        return template;
    }


    /**
     * Format §§IFENV_ENVPARAMNAME§§then§§else§§
     * Test booleen sur le param, incluant son existence et sa non nullité
     */
    public static resolveEnvConditions(template: string): string {
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
    public static resolveVarConditions(template: string, vars: { [name: string]: string }): string {
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

    public static async replaceTrads(template: string, lang_id: number): Promise<string> {

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

    public static replaceEnvParams(template: string): string {

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

    public static replaceVars(template: string, vars: { [name: string]: string }): string {

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
