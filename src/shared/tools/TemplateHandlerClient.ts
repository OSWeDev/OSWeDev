
export default class TemplateHandlerClient {

    // istanbul ignore next: nothing to test
    public static getInstance(): TemplateHandlerClient {
        if (!TemplateHandlerClient.instance) {
            TemplateHandlerClient.instance = new TemplateHandlerClient();
        }
        return TemplateHandlerClient.instance;
    }

    private static instance: TemplateHandlerClient = null;

    private constructor() {
    }

    public prepareHTML(template: string, env: { [name: string]: any } = null, vars: { [name: string]: string } = null, t: (code: string) => string): string {

        // Les trads peuvent contenir des envs params
        template = this.resolveVarConditions(template, vars);
        template = this.replaceTrads(template, t);
        template = this.replaceEnvParams(template, env);

        if (vars) {
            template = this.replaceVars(template, vars);
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

    public replaceTrads(template: string, t: (code: string) => string): string {

        const regExp = new RegExp('%%TRAD%%([^% ]+)%%', 'i');

        while (regExp.test(template)) {
            const regexpres: string[] = regExp.exec(template);
            const tradname: string = regexpres[1];

            if (!tradname) {
                template = template.replace(regExp, '');
                continue;
            }

            template = template.replace(regExp, t(tradname));
        }

        return template;
    }

    public replaceEnvParams(template: string, env: { [name: string]: any }): string {

        const regExp = new RegExp('%%ENV%%([^% ]+)%%', 'i');
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
