/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20230427PatchPies implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20230427PatchPies {
        if (!Patch20230427PatchPies.instance) {
            Patch20230427PatchPies.instance = new Patch20230427PatchPies();
        }
        return Patch20230427PatchPies.instance;
    }

    private static instance: Patch20230427PatchPies = null;

    get uid(): string {
        return 'Patch20230427PatchPies';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let translation = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'var_pie_chart_widget_options_component.cutout_percentage.tooltip.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr', LangVO.API_TYPE_ID)
            .select_vo<TranslationVO>();
        translation.translated = 'Indique la zone qui sera découpée dans le graphique en partant du centre vers les extrémités en pourcentage. 0 pour ne pas découper, 100 pour découper tout le graphique. Exemple : 50 pour un donut';
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(translation);

        translation = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'var_pie_chart_widget_options_component.rotation.tooltip.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr', LangVO.API_TYPE_ID)
            .select_vo<TranslationVO>();
        translation.translated = 'Point de départ du graphique en degrés. Entre 0 et 360. Exemple pour une jauge : 270';
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(translation);

        translation = await query(TranslationVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'var_pie_chart_widget_options_component.circumference.tooltip.___LABEL___', TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr', LangVO.API_TYPE_ID)
            .select_vo<TranslationVO>();
        translation.translated = 'Circumference du graphique. Entre 0 et 360. Exemple pour une jauge : 180';
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(translation);


    }
}