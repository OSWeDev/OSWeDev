/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20220809ChangeDbbTrad implements IGeneratorWorker {

    public static getInstance(): Patch20220809ChangeDbbTrad {
        if (!Patch20220809ChangeDbbTrad.instance) {
            Patch20220809ChangeDbbTrad.instance = new Patch20220809ChangeDbbTrad();
        }
        return Patch20220809ChangeDbbTrad.instance;
    }

    private static instance: Patch20220809ChangeDbbTrad = null;

    get uid(): string {
        return 'Patch20220809ChangeDbbTrad';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        await this.update_trad('table_widget_column_conf.column_width.___LABEL___', 'Largeur du contenu de la colonne, en rem (requis si colonne figée)');
    }

    private async update_trad(code: string, text: string) {
        let trad: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(code);
        if (!trad) {
            DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
                'fr-fr': text
            }, code));
        } else {
            let fr = await ModuleTranslation.getInstance().getLang('fr-fr');
            if (fr) {
                let trad_fr: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<TranslationVO>().lang_id, fr.id)
                    .filter_by_num_eq(field_names<TranslationVO>().text_id, trad.id)
                    .select_vo<TranslationVO>();
                if (!trad_fr) {
                    DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation({
                        'fr-fr': text
                    }, code));
                } else {
                    trad_fr.translated = text;
                    await ModuleDAO.getInstance().insertOrUpdateVO(trad_fr);
                }
            }
        }
    }
}