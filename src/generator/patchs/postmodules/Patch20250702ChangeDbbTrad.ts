/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250702ChangeDbbTrad implements IGeneratorWorker {


    private static instance: Patch20250702ChangeDbbTrad = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250702ChangeDbbTrad';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250702ChangeDbbTrad {
        if (!Patch20250702ChangeDbbTrad.instance) {
            Patch20250702ChangeDbbTrad.instance = new Patch20250702ChangeDbbTrad();
        }
        return Patch20250702ChangeDbbTrad.instance;
    }

    public async work(db: IDatabase<any>) {
        await this.update_trad('dashboard_builder.select_vos.___LABEL___', 'Données');
        await this.update_trad('dashboard_builder.build_page.___LABEL___', 'Widgets');
        await this.update_trad('dashboard_builder.menu_conf.___LABEL___', 'Menus');
        await this.update_trad('dashboard_builder.shared_filters.___LABEL___', 'Filtres Partagés');
    }

    private async update_trad(code: string, text: string) {
        const trad: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(code);
        if (!trad) {
            DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
                'fr-fr': text
            }, code));
        } else {
            const fr = await ModuleTranslation.getInstance().getLang('fr-fr');
            if (fr) {
                const trad_fr: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<TranslationVO>().lang_id, fr.id)
                    .filter_by_num_eq(field_names<TranslationVO>().text_id, trad.id)
                    .select_vo<TranslationVO>();
                if (!trad_fr) {
                    DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
                        'fr-fr': text
                    }, code));
                } else {
                    trad_fr.translated = text;
                    await ModuleDAOServer.instance.insertOrUpdateVO_as_server(trad_fr);
                }
            }
        }
    }
}