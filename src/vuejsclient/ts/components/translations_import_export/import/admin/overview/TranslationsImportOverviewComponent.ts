
import Component from 'vue-class-component';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleDataExport from '../../../../../../../shared/modules/DataExport/ModuleDataExport';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ImportTranslation from '../../../../../../../shared/modules/Translation/import/vos/ImportTranslation';
import LangVO from '../../../../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import DateHandler from '../../../../../../../shared/tools/DateHandler';
import VueComponentBase from '../../../../VueComponentBase';
import './TranslationsImportOverviewComponent.scss';

@Component({
    template: require('./TranslationsImportOverviewComponent.pug'),
    components: {}
})
export default class TranslationsImportOverviewComponent extends VueComponentBase {

    public api_type_ids: string[] = [ImportTranslation.API_TYPE_ID];

    protected state_none: string = "none";
    protected state_ok: string = "ok";
    protected state_ko: string = "ko";
    protected state_warn: string = "warn";
    protected state_unavail: string = "unavail";
    protected state_info: string = "info";

    private exportable_data: any[] = [];

    private async export_translations() {

        await this.set_exportable_data();
        await ModuleDataExport.getInstance().exportDataToXLSX(
            "export_translations_" + DateHandler.getInstance().formatDayForIndex(Dates.now()) + ".xlsx",
            this.exportable_data,
            this.exportable_columns,
            this.columns_labels,
            ImportTranslation.API_TYPE_ID);
    }

    private async set_exportable_data() {
        this.exportable_data = [];

        const langs_by_ids: { [id: number]: LangVO } = VOsTypesManager.vosArray_to_vosByIds(await query(LangVO.API_TYPE_ID).select_vos<LangVO>());
        const translatables_by_ids: { [id: number]: TranslatableTextVO } = VOsTypesManager.vosArray_to_vosByIds(await query(TranslatableTextVO.API_TYPE_ID).select_vos<TranslatableTextVO>());
        const translations: TranslationVO[] = await query(TranslationVO.API_TYPE_ID).select_vos<TranslationVO>();

        for (const i in translations) {
            const translation: TranslationVO = translations[i];

            const data = new ImportTranslation();
            data.code_lang = langs_by_ids[translation.lang_id].code_lang;
            data.code_text = translatables_by_ids[translation.text_id].code_text;
            data.translated = translation.translated;
            this.exportable_data.push(data);
        }
    }

    get exportable_columns(): string[] {
        return [
            'code_lang',
            'code_text',
            'translated'
        ];
    }

    get columns_labels(): any {
        return {
            code_lang: 'code_lang',
            code_text: 'code_text',
            translated: 'translated'
        };
    }
}