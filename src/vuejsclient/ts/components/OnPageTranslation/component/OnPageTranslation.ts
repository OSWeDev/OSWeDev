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
import ObjectHandler, { field_names } from '../../../../../shared/tools/ObjectHandler';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleGPT from '../../../../../shared/modules/GPT/ModuleGPT';
import GPTCompletionAPIMessageVO from '../../../../../shared/modules/GPT/vos/GPTCompletionAPIMessageVO';
import GPTCompletionAPIConversationVO from '../../../../../shared/modules/GPT/vos/GPTCompletionAPIConversationVO';

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
    private missingTranslationsNumber: number = 0;

    private debounced_onChange_getPageTranslations = debounce(this.change_page_translations_wrapper.bind(this), 500);

    public async mounted() {
        this.startLoading();

        const self = this;
        const promises: Array<Promise<any>> = [];

        promises.push((async () => {
            const vos: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
            self.storeDatas({
                API_TYPE_ID: LangVO.API_TYPE_ID,
                vos: vos
            });
        })());

        await all_promises(promises);

        for (const i in this.getStoredDatas[LangVO.API_TYPE_ID]) {
            const lang: LangVO = this.getStoredDatas[LangVO.API_TYPE_ID][i] as LangVO;

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

    private set_missingTranslationsNumber() {
        let res: number = 0;

        for (const i in this.editable_translations) {
            if (!this.editable_translations[i].translation || this.editable_translations[i].missing) {
                res++;
            }
        }

        this.missingTranslationsNumber = res;
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
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, editable_translation.translation_code)
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

            const translation: TranslationVO = new TranslationVO();
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
                const langs: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();

                for (const i in langs) {
                    if (langs[i].id == this.lang_id) {
                        continue;
                    }

                    this.other_langs.push(langs[i]);
                }
            }

            if ((!this.other_langs) || (this.other_langs.length <= 0)) {
                return;
            }

            for (const l in this.other_langs) {
                const other_lang: LangVO = this.other_langs[l];

                if (!this.translations[other_lang.code_lang]) {
                    Vue.set(this.translations, other_lang.code_lang, {});
                    Vue.set(this.translations_loaded, other_lang.code_lang, {});
                }

                if (!this.translations_loaded[other_lang.code_lang][editable_translation.translation_code]) {

                    Vue.set(this.translations_loaded[other_lang.code_lang], editable_translation.translation_code, true);

                    const translation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, editable_translation.translation_code, TranslatableTextVO.API_TYPE_ID)
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

            const object = JSON.parse(this.imported_translations);

            if (!object) {
                return;
            }

            // On essaie de faire chaque trad
            for (const i in this.editable_translations) {
                const editable_translation = this.editable_translations[i];

                if (editable_translation.translation) {
                    continue;
                }

                const parts: string[] = editable_translation.translation_code.split('.');
                let obj = object;
                let failed: boolean = false;
                for (const j in parts) {
                    obj = obj[parts[j]];

                    if (!obj) {
                        failed = true;
                        break;
                    }
                }

                if (failed) {
                    continue;
                }

                if (obj) {
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

        if ((!this.lang_id) || (!this.getPageTranslations)) {
            return;
        }

        const texts = Object.keys(this.getPageTranslations);
        if ((!texts) || (!texts.length)) {
            return;
        }

        const translation_by_code_text: {
            [code_text: string]: {
                code_text: string,
                translated: string,
                id,
                lang_id,
                text_id
            }
        } = ObjectHandler.mapByStringFieldFromArray(
            await query(TranslationVO.API_TYPE_ID)
                .field(field_names<TranslatableTextVO>().code_text, null, TranslatableTextVO.API_TYPE_ID)
                .field(field_names<TranslationVO>().id)
                .field(field_names<TranslationVO>().lang_id)
                .field(field_names<TranslationVO>().text_id)
                .field(field_names<TranslationVO>().translated)
                .filter_by_text_has(field_names<TranslatableTextVO>().code_text, texts, TranslatableTextVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<TranslationVO>().lang_id, this.lang_id)
                .set_max_age_ms(1000 * 60) // 1 minute de cache - on peut imaginer plus si on a une invalidation du cache via trigger. pour l'instant c'est pas le cas
                .select_all() as any,
            'code_text'
        );

        const new_editable_translations: EditablePageTranslationItem[] = [];
        for (const i in texts) {
            let translation = null;
            const code_text: string = texts[i];
            const t = translation_by_code_text[code_text];

            if (t) {
                translation = new TranslationVO();
                translation.lang_id = this.lang_id;
                translation.id = parseInt(t.id);
                translation.lang_id = parseInt(t.lang_id);
                translation.text_id = parseInt(t.text_id);
                translation.translated = t.translated;
            }

            this.translations_by_code[code_text] = translation;
            const editable_translation: EditablePageTranslationItem = new EditablePageTranslationItem(code_text, this.translations_by_code[code_text]);

            if (!editable_translation.translation) {
                editable_translation.missing = true;
            }

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

        for (const i in this.editable_translations) {
            const editable_translation: EditablePageTranslationItem = this.editable_translations[i];
            if (this.updated_translation(editable_translation)) {
                for (const j in new_editable_translations) {
                    if (new_editable_translations[j].translation_code == editable_translation.translation_code) {
                        new_editable_translations[j].editable_translation = editable_translation.editable_translation;
                    }
                }
            }
        }
        this.editable_translations = new_editable_translations;
        this.set_missingTranslationsNumber();
    }

    private async get_gpt_translation(editable_translation: EditablePageTranslationItem) {
        if (!editable_translation) {
            return;
        }

        if (!this.lang_id) {
            return;
        }

        /**
         * Pour le prompt, on demande de traduire le code_text, on fournit la trad actuelle si il y en a une (trad validée, pas en cours de saisie)
         *  et la trad de ce code dans les autres langues, si on a l'info, et enfin on fourni aussi les autres codes de la page actuelle
         */

        const langs_by_id: { [id: number]: LangVO } = this.getStoredDatas[LangVO.API_TYPE_ID] as { [id: number]: LangVO };

        let max_tokens = 8192;

        let prompt: string = "Tu es traducteur, et tu es sur une page web dont le contenu peut être traduit dans différentes langues.\n" +
            "Ton objectif est de remplir un input de type text avec la traduction la plus appropriée pour la langue dont le code est " + langs_by_id[this.lang_id].code_lang + ".\n" +
            "Tu dois répondre uniquement la traduction, tu ne peux pas demander de complément d'information. Si tu ne sais pas traduire le code texte, tu ne dois rien répondre du tout.\n" +
            "Pour cela, tu peux t'aider de la traduction actuelle, si il y en a une, et des traductions dans les autres langues, si il y en a.\n" +
            "Tu peux aussi t'aider du contexte de la page, et des autres traductions de la page.\n" +
            "Les traductions sont gérés par des codes qui servent à identifier le positionnement dans la page. Le code du texte que tu dois traduire maintenant est \"" + editable_translation.translation_code + "\".\n";

        if (editable_translation.translation && !this.updated_translation(editable_translation)) {
            prompt += "La traduction actuelle est \"" + editable_translation.translation.translated + "\".\n";
        }

        for (const i in this.other_langs) {
            const other_lang: LangVO = this.other_langs[i];
            if (this.translations[other_lang.code_lang] && this.translations[other_lang.code_lang][editable_translation.translation_code]) {
                prompt += "La traduction en \"" + other_lang.code_lang + "\" est \"" + this.translations[other_lang.code_lang][editable_translation.translation_code].translated + "\".\n";
            }
        }

        prompt += "Les autres codes de la page et leurs traductions en \"" + langs_by_id[this.lang_id].code_lang + "\" sont :\n";
        const last_sentence = "Ta réponse doit se limiter à la traduction du code, sans rappeler le code, sans guillemets et sans retour à la ligne. Uniquement la traduction brute.\n";
        max_tokens -= (prompt.split(' ').length * 2) + (last_sentence.split(' ').length * 2);

        for (const i in this.editable_translations) {
            const e: EditablePageTranslationItem = this.editable_translations[i];

            if (e.translation_code == editable_translation.translation_code) {
                continue;
            }
            const this_prompt = " - \"" + e.translation_code + "\" : \"" + (e.translation ? e.translation.translated : '') + "\"\n";
            max_tokens -= (prompt.split(' ').length * 2);
            if (max_tokens < 0) {
                break;
            }

            prompt += this_prompt;
        }

        prompt += last_sentence;

        ConsoleHandler.log(prompt);

        const self = this;
        self.snotify.async(self.label('get_gpt_translation.start'), () =>
            new Promise(async (resolve, reject) => {

                try {

                    const gpt_response: GPTCompletionAPIMessageVO = await ModuleGPT.getInstance().generate_response(new GPTCompletionAPIConversationVO(), GPTCompletionAPIMessageVO.createNew(GPTCompletionAPIMessageVO.GPTMSG_ROLE_TYPE_USER, VueAppController.getInstance().data_user.id, prompt));

                    if (!gpt_response) {
                        reject({
                            body: self.label('get_gpt_translation.failed'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    if (!gpt_response.content) {
                        reject({
                            body: self.label('get_gpt_translation.failed'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    if (gpt_response.content.startsWith('"') && gpt_response.content.endsWith('"')) {
                        gpt_response.content = gpt_response.content.substring(1, gpt_response.content.length - 1);
                    }

                    editable_translation.editable_translation = gpt_response.content;

                    resolve({
                        body: self.label('get_gpt_translation.ok', { gpt_response: gpt_response.content }),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                } catch (error) {
                    reject({
                        body: self.label('get_gpt_translation.error', { error: (error && (typeof error == 'string')) ? error : error.message }),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }
}