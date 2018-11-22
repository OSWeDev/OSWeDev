import { Component, Watch } from "vue-property-decorator";
import ModuleAccessPolicy from "../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleTranslation from "../../../../../shared/modules/Translation/ModuleTranslation";
import VueComponentBase from "../../../../ts/components/VueComponentBase";
import './OnPageTranslation.scss';
import VueAppController from '../../../../VueAppController';
import EditablePageTranslationItem from '../vos/EditablePageTranslationItem';
import { ModuleOnPageTranslationGetter } from '../store/OnPageTranslationStore';
import OnPageTranslationItem from '../vos/OnPageTranslationItem';
import * as debounce from 'lodash/debounce';
import { ModuleDAOGetter, ModuleDAOAction } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import LocaleManager from '../../../../../shared/tools/LocaleManager';

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
    private translatables_by_code: { [translation_code: string]: TranslatableTextVO } = {};

    // Pas idéal mais en attendant de gérer les trads en interne.
    private lang_id: number = null;

    public async mounted() {
        this.startLoading();

        let self = this;
        let promises: Array<Promise<any>> = [];

        promises.push((async () => {
            let vos: TranslatableTextVO[] = await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: TranslatableTextVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: LangVO.API_TYPE_ID,
                vos: vos
            });
        })());
        promises.push((async () => {
            let vos: TranslationVO[] = await ModuleDAO.getInstance().getVos<TranslationVO>(TranslationVO.API_TYPE_ID);
            self.storeDatas({
                API_TYPE_ID: TranslationVO.API_TYPE_ID,
                vos: vos
            });
        })());

        await Promise.all(promises);

        for (let i in this.getStoredDatas[LangVO.API_TYPE_ID]) {
            let lang: LangVO = this.getStoredDatas[LangVO.API_TYPE_ID][i] as LangVO;

            if (lang.code_lang == LocaleManager.getInstance().getDefaultLocale()) {
                this.lang_id = lang.id;
                break;
            }
        }

        this.setTranslatables_by_code();
        this.setTranslations_by_code();

        this.stopLoading();
    }

    @Watch('getPageTranslations', { deep: true, immediate: true })
    private onChange_getPageTranslations() {

        // On debounce pour un lancement uniquement toutes les 2 secondes, sinon on va tout écrouler...
        this.debounced_onChange_getPageTranslations();
    }

    private setTranslations_by_code() {
        this.translations_by_code = {};

        for (let i in this.getStoredDatas[TranslationVO.API_TYPE_ID]) {
            let translation: TranslationVO = this.getStoredDatas[TranslationVO.API_TYPE_ID][i] as TranslationVO;
            let translatable: TranslatableTextVO = this.getStoredDatas[TranslatableTextVO.API_TYPE_ID][translation.text_id] as TranslatableTextVO;

            if (translation.lang_id != this.lang_id) {
                continue;
            }
            this.translations_by_code[translatable.code_text] = translation;
        }
    }

    private setTranslatables_by_code() {
        this.translatables_by_code = {};

        for (let i in this.getStoredDatas[TranslatableTextVO.API_TYPE_ID]) {
            let translatable: TranslatableTextVO = this.getStoredDatas[TranslatableTextVO.API_TYPE_ID][i] as TranslatableTextVO;

            this.translatables_by_code[translatable.code_text] = translatable;
        }
    }

    get debounced_onChange_getPageTranslations() {
        let self = this;
        return debounce(() => {

            let new_editable_translations: EditablePageTranslationItem[] = [];

            this.setTranslatables_by_code();
            this.setTranslations_by_code();

            for (let i in self.getPageTranslations) {
                let pageTranslation: OnPageTranslationItem = self.getPageTranslations[i];

                let editable_translation: EditablePageTranslationItem = new EditablePageTranslationItem(pageTranslation.translation_code, self.translations_by_code[pageTranslation.translation_code]);
                new_editable_translations.push(editable_translation);
            }

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

            for (let i in self.editable_translations) {
                let editable_translation: EditablePageTranslationItem = self.editable_translations[i];
                if (self.updated_translation(editable_translation)) {
                    for (let j in new_editable_translations) {
                        if (new_editable_translations[j].translation_code == editable_translation.translation_code) {
                            new_editable_translations[j].editable_translation = editable_translation.editable_translation;
                        }
                    }
                }
            }
            self.editable_translations = new_editable_translations;
        }, 500);
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
            let translatable: TranslatableTextVO = this.translatables_by_code[editable_translation.translation_code];
            if (!translatable) {
                translatable = new TranslatableTextVO();
                translatable.code_text = editable_translation.translation_code;
                insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(translatable);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    this.snotify.error(this.label('on_page_translation.save_translation.ko'));
                    return;
                }
                translatable.id = parseInt(insertOrDeleteQueryResult.id);
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
            translation.id = parseInt(insertOrDeleteQueryResult.id);
            editable_translation.translation = translation;
            this.storeData(translation);
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
}