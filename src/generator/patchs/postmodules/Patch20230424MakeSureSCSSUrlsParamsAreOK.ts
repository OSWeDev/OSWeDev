/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230424MakeSureSCSSUrlsParamsAreOK implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20230424MakeSureSCSSUrlsParamsAreOK {
        if (!Patch20230424MakeSureSCSSUrlsParamsAreOK.instance) {
            Patch20230424MakeSureSCSSUrlsParamsAreOK.instance = new Patch20230424MakeSureSCSSUrlsParamsAreOK();
        }
        return Patch20230424MakeSureSCSSUrlsParamsAreOK.instance;
    }

    private static instance: Patch20230424MakeSureSCSSUrlsParamsAreOK = null;

    get uid(): string {
        return 'Patch20230424MakeSureSCSSUrlsParamsAreOK';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        /**
         * On checke que les params suivant commencent bien par ./ et non /
         * "sass_skin_generator.main_background_url"
         * "sass_skin_generator.box_title_bg_url"
         * "sass_skin_generator.picto_store_url"
         * "sass_skin_generator.picto_store_info_url"
         * "sass_skin_generator.picto_orga_url"
         * "sass_skin_generator.picto_tool_small_url"
         * "sass_skin_generator.picto_fleche_verte_url"
         * "sass_skin_generator.picto_clock_small_url"
         * "sass_skin_generator.picto_objectivos_url"
         * "sass_skin_generator.picto_atteindre_url"
         * "sass_skin_generator.picto_equipe_url"
         * "sass_skin_generator.main_background_header_url"
         */


        const main_background_url = await this.get_param_value("sass_skin_generator.main_background_url", db);
        const box_title_bg_url = await this.get_param_value("sass_skin_generator.box_title_bg_url", db);
        const picto_store_url = await this.get_param_value("sass_skin_generator.picto_store_url", db);
        const picto_store_info_url = await this.get_param_value("sass_skin_generator.picto_store_info_url", db);
        const picto_orga_url = await this.get_param_value("sass_skin_generator.picto_orga_url", db);
        const picto_tool_small_url = await this.get_param_value("sass_skin_generator.picto_tool_small_url", db);
        const picto_fleche_verte_url = await this.get_param_value("sass_skin_generator.picto_fleche_verte_url", db);
        const picto_clock_small_url = await this.get_param_value("sass_skin_generator.picto_clock_small_url", db);
        const picto_objectivos_url = await this.get_param_value("sass_skin_generator.picto_objectivos_url", db);
        const picto_atteindre_url = await this.get_param_value("sass_skin_generator.picto_atteindre_url", db);
        const picto_equipe_url = await this.get_param_value("sass_skin_generator.picto_equipe_url", db);
        const main_background_header_url = await this.get_param_value("sass_skin_generator.main_background_header_url", db);

        await this.checkOrUpdate(main_background_url, "sass_skin_generator.main_background_url", db);
        await this.checkOrUpdate(box_title_bg_url, "sass_skin_generator.box_title_bg_url", db);
        await this.checkOrUpdate(picto_store_url, "sass_skin_generator.picto_store_url", db);
        await this.checkOrUpdate(picto_store_info_url, "sass_skin_generator.picto_store_info_url", db);
        await this.checkOrUpdate(picto_orga_url, "sass_skin_generator.picto_orga_url", db);
        await this.checkOrUpdate(picto_tool_small_url, "sass_skin_generator.picto_tool_small_url", db);
        await this.checkOrUpdate(picto_fleche_verte_url, "sass_skin_generator.picto_fleche_verte_url", db);
        await this.checkOrUpdate(picto_clock_small_url, "sass_skin_generator.picto_clock_small_url", db);
        await this.checkOrUpdate(picto_objectivos_url, "sass_skin_generator.picto_objectivos_url", db);
        await this.checkOrUpdate(picto_atteindre_url, "sass_skin_generator.picto_atteindre_url", db);
        await this.checkOrUpdate(picto_equipe_url, "sass_skin_generator.picto_equipe_url", db);
        await this.checkOrUpdate(main_background_header_url, "sass_skin_generator.main_background_header_url", db);
    }

    private async checkOrUpdate(param_value: string, param_name: string, db: IDatabase<any>) {

        if (param_value.indexOf('"/client/public/') == 0) {
            await db.query('UPDATE ref.module_params_param SET value = $1 WHERE name = $2', ["\"./dist/client/public/" + param_value.substring('"/client/public/'.length, param_value.length), param_name]);
        }
    }

    private async get_param_value(param_name: string, db: IDatabase<any>) {
        const param = await db.query("SELECT * from ref.module_params_param where name = '" + param_name + "';");
        if (!param || !param[0]) {
            return null;
        }

        return param[0].value;
    }
}