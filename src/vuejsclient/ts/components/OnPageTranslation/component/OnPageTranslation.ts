import debounce from 'lodash/debounce';
import { Component, Vue, Watch } from "vue-property-decorator";
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTranslation from "../../../../../shared/modules/Translation/ModuleTranslation";
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import VueComponentBase from "../../../../ts/components/VueComponentBase";
import VueAppController from '../../../../VueAppController';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import { ModuleOnPageTranslationGetter } from '../store/OnPageTranslationStore';
import EditablePageTranslationItem from '../vos/EditablePageTranslationItem';
import OnPageTranslationItem from '../vos/OnPageTranslationItem';
import './OnPageTranslation.scss';

@Component({
    template: require('./OnPageTranslation.pug')
})
export default class OnPageTranslation extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @ModuleOnPageTranslationGetter
    public getPageTranslations: { [translation_code: string]: OnPageTranslationItem };

    private isOpened: boolean = false;
    private editable_translations: EditablePageTranslationItem[] = [];

    private translations_by_code: { [translation_code: string]: TranslationVO } = {};

    private show_other_langs: { [translation_code: string]: boolean } = {};
    private translations: { [lang: string]: { [translation_code: string]: TranslationVO } } = {};
    private translations_loaded: { [lang: string]: { [translation_code: string]: boolean } } = {};

    private other_langs: LangVO[] = null;

    private imported_translations: string = '';

    // Pas idéal mais en attendant de gérer les trads en interne.
    private lang_id: number = null;

    private debounced_onChange_getPageTranslations = debounce(this.change_page_translations_wrapper.bind(this), 500);

    public async mounted() {
        this.startLoading();

        let self = this;
        let promises: Array<Promise<any>> = [];

        promises.push((async () => {
            let vos: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
            self.storeDatas({
                API_TYPE_ID: LangVO.API_TYPE_ID,
                vos: vos
            });
        })());

        await all_promises(promises);

        for (let i in this.getStoredDatas[LangVO.API_TYPE_ID]) {
            let lang: LangVO = this.getStoredDatas[LangVO.API_TYPE_ID][i] as LangVO;

            if (lang.code_lang == LocaleManager.getInstance().getDefaultLocale()) {
                this.lang_id = lang.id;
                break;
            }
        }

        this.stopLoading();
    }

    @Watch('getPageTranslations', { deep: true, immediate: true })
    private onChange_getPageTranslations() {

        // On debounce pour un lancement uniquement toutes les 2 secondes, sinon on va tout écrouler...
        this.debounced_onChange_getPageTranslations();
    }

    get missingTranslationsNumber(): number {
        let res: number = 0;

        for (let i in this.editable_translations) {
            if (!this.editable_translations[i].translation) {
                res++;
            }
        }

        return res;
    }

    get isActive(): boolean {
        return ModuleTranslation.getInstance().actif && VueAppController.getInstance().has_access_to_onpage_translation;
    }

    private openModule() {
        this.isOpened = true;
    }

    private closeModule() {
        this.isOpened = false;
    }

    private updated_translation(editable_translation: EditablePageTranslationItem): boolean {
        if (!editable_translation) {
            return false;
        }

        if ((!editable_translation.translation) && ((!!editable_translation.editable_translation) && (editable_translation.editable_translation != ""))) {
            return true;
        }
        if (!editable_translation.translation) {
            return false;
        }

        return editable_translation.editable_translation != editable_translation.translation.translated;
    }

    private rollback_translation(editable_translation: EditablePageTranslationItem) {
        if (!editable_translation) {
            return false;
        }

        editable_translation.editable_translation = (editable_translation.translation ? editable_translation.translation.translated : null);
    }

    private async save_translation(editable_translation: EditablePageTranslationItem) {

        if (!this.updated_translation(editable_translation)) {
            return;
        }

        this.snotify.info(this.label('on_page_translation.save_translation.start'));

        if (!editable_translation) {
            this.snotify.error(this.label('on_page_translation.save_translation.ko'));
            return false;
        }

        if ((!editable_translation) || (!editable_translation.editable_translation) || (editable_translation.editable_translation == "")) {
            this.snotify.error(this.label('on_page_translation.save_translation.ko'));
            return;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult;
        if (!editable_translation.translation) {
            // c'est une création

            // on doit tester d'abord le translatable puis la translation
            let translatable: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_text_eq('code_text', editable_translation.translation_code)
                .select_vo<TranslatableTextVO>();
            if (!translatable) {
                translatable = new TranslatableTextVO();
                translatable.code_text = editable_translation.translation_code;
                insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(translatable);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    this.snotify.error(this.label('on_page_translation.save_translation.ko'));
                    return;
                }
                translatable.id = insertOrDeleteQueryResult.id;
                this.storeData(translatable);
            }

            let translation: TranslationVO = new TranslationVO();
            translation.lang_id = this.lang_id;
            translation.text_id = translatable.id;
            translation.translated = editable_translation.editable_translation;
            insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(translation);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                this.snotify.error(this.label('on_page_translation.save_translation.ko'));
                return;
            }
            translation.id = insertOrDeleteQueryResult.id;
            editable_translation.translation = translation;
            this.storeData(translation);
            this.translations_by_code[editable_translation.translation_code] = translation;
            this.snotify.success(this.label('on_page_translation.save_translation.ok'));
            return;
        }

        // c'est un update
        editable_translation.translation.translated = editable_translation.editable_translation;
        insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(editable_translation.translation);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('on_page_translation.save_translation.ko'));
            return;
        }
        this.updateData(editable_translation.translation);
        this.snotify.success(this.label('on_page_translation.save_translation.ok'));
    }

    private async switch_show_other_langs(editable_translation: EditablePageTranslationItem) {

        Vue.set(this.show_other_langs, editable_translation.translation_code, !this.show_other_langs[editable_translation.translation_code]);

        if (this.show_other_langs[editable_translation.translation_code]) {

            if (!this.other_langs) {
                this.other_langs = [];
                let langs: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();

                for (let i in langs) {
                    if (langs[i].id == this.lang_id) {
                        continue;
                    }

                    this.other_langs.push(langs[i]);
                }
            }

            if ((!this.other_langs) || (this.other_langs.length <= 0)) {
                return;
            }

            for (let l in this.other_langs) {
                let other_lang: LangVO = this.other_langs[l];

                if (!this.translations[other_lang.code_lang]) {
                    Vue.set(this.translations, other_lang.code_lang, {});
                    Vue.set(this.translations_loaded, other_lang.code_lang, {});
                }

                if (!this.translations_loaded[other_lang.code_lang][editable_translation.translation_code]) {

                    Vue.set(this.translations_loaded[other_lang.code_lang], editable_translation.translation_code, true);

                    let translation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                        .filter_by_text_eq('code_text', editable_translation.translation_code, TranslatableTextVO.API_TYPE_ID)
                        .filter_by_id(other_lang.id, LangVO.API_TYPE_ID)
                        .select_vo<TranslationVO>();
                    Vue.set(this.translations[other_lang.code_lang], editable_translation.translation_code, translation);
                    Vue.set(this.translations_loaded[other_lang.code_lang], editable_translation.translation_code, true);
                }
            }
        }
    }

    /**
     * Goal is to get a JSON and fill the empty translations in the page and save them all
     */
    private async import_translations() {

        try {
            if (!this.imported_translations) {
                return;
            }

            let object = JSON.parse(this.imported_translations);

            if (!object) {
                return;
            }

            // On essaie de faire chaque trad
            for (let i in this.editable_translations) {
                let editable_translation = this.editable_translations[i];

                if (!!editable_translation.translation) {
                    continue;
                }

                let parts: string[] = editable_translation.translation_code.split('.');
                let obj = object;
                let failed: boolean = false;
                for (let j in parts) {
                    obj = obj[parts[j]];

                    if (!obj) {
                        failed = true;
                        break;
                    }
                }

                if (failed) {
                    continue;
                }

                if (!!obj) {
                    editable_translation.editable_translation = obj;
                    await this.save_translation(editable_translation);
                }
            }

            this.snotify.success('Import de trads OK, recharger.');
        } catch (error) {
            ConsoleHandler.error(error);
            this.snotify.error(error);
        }
    }

    private async change_page_translations_wrapper() {

        if (!this.lang_id) {
            return;
        }

        let new_editable_translations: EditablePageTranslationItem[] = [];

        let promises = [];
        for (let i in this.getPageTranslations) {
            let pageTranslation: OnPageTranslationItem = this.getPageTranslations[i];

            promises.push((async () => {
                if (!this.translations_by_code[pageTranslation.translation_code]) {
                    this.translations_by_code[pageTranslation.translation_code] = await query(TranslationVO.API_TYPE_ID)
                        .filter_by_text_eq('code_text', pageTranslation.translation_code, TranslatableTextVO.API_TYPE_ID)
                        .filter_by_num_eq('lang_id', this.lang_id)
                        .select_vo<TranslationVO>();
                }
                let editable_translation: EditablePageTranslationItem = new EditablePageTranslationItem(pageTranslation.translation_code, this.translations_by_code[pageTranslation.translation_code]);
                new_editable_translations.push(editable_translation);
            })());
        }
        await all_promises(promises);

        new_editable_translations.sort((a: EditablePageTranslationItem, b: EditablePageTranslationItem) => {
            if (a.missing && !b.missing) {
                return -1;
            }
            if ((!a.missing) && b.missing) {
                return 1;
            }

            if (a.translation_code < b.translation_code) {
                return -1;
            }
            if (a.translation_code > b.translation_code) {
                return 1;
            }

            return 0;
        });

        for (let i in this.editable_translations) {
            let editable_translation: EditablePageTranslationItem = this.editable_translations[i];
            if (this.updated_translation(editable_translation)) {
                for (let j in new_editable_translations) {
                    if (new_editable_translations[j].translation_code == editable_translation.translation_code) {
                        new_editable_translations[j].editable_translation = editable_translation.editable_translation;
                    }
                }
            }
        }
        this.editable_translations = new_editable_translations;
    }
}