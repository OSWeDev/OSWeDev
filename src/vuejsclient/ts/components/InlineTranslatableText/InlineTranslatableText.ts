import { Component, Prop } from "vue-property-decorator";
import Throttle from "../../../../shared/annotations/Throttle";
import { filter } from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import EventifyEventListenerConfVO from "../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import LangVO from "../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../shared/modules/Translation/vos/TranslationVO";
import { field_names, reflect } from "../../../../shared/tools/ObjectHandler";
import VueAppController from "../../../VueAppController";
import { SafeWatch } from "../../tools/annotations/SafeWatch";
import { SyncVO } from "../../tools/annotations/SyncVO";
import { SyncVOs } from "../../tools/annotations/SyncVOs";
import LangSelectorComponent from "../lang_selector/LangSelectorComponent";
import VueComponentBase from "../VueComponentBase";
import './InlineTranslatableText.scss';
import TranslatableTextController from "./TranslatableTextController";
import { ModuleTranslatableTextGetter } from './TranslatableTextStore';
import ThreadHandler from "../../../../shared/tools/ThreadHandler";

@Component({
    template: require('./InlineTranslatableText.pug'),
    components: {
        LangSelectorComponent: LangSelectorComponent,
    }
})
export default class InlineTranslatableText extends VueComponentBase {

    @ModuleTranslatableTextGetter
    public get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    public code_text: string;

    @Prop({ default: false })
    public is_editable: boolean;

    @Prop({ default: null })
    public default_translation: string;

    @Prop({ default: null })
    public translation_params: any;

    @Prop({ default: false })
    public textarea: boolean;

    @SyncVO(LangVO.API_TYPE_ID, {
        watch_fields: [reflect<InlineTranslatableText>().code_lang],

        debug: true,

        id_factory: async (self) => {

            if (!self.code_lang) {
                return null;
            }

            return query(LangVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<LangVO>().code_lang, self.code_lang)
                .select_vo<LangVO>();
        },
    })
    public lang: LangVO = null;


    @SyncVO(TranslatableTextVO.API_TYPE_ID, {
        watch_fields: [reflect<InlineTranslatableText>().code_text],

        debug: true,

        id_factory: async (self) => {

            if (!self.code_text) {
                return null;
            }

            let text: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, self.code_text)
                .select_vo<TranslatableTextVO>();

            if (!text) {
                text = new TranslatableTextVO();
                text.code_text = self.code_text;
                await ModuleDAO.getInstance().insertOrUpdateVO(text);
            }

            return text;
        },
    })
    public translatable_text: TranslatableTextVO = null;

    @SyncVOs(TranslationVO.API_TYPE_ID, {
        watch_fields: [
            reflect<InlineTranslatableText>().translatable_text,
            reflect<InlineTranslatableText>().lang,
        ],

        debug: true,

        filters_factory: (self) => {

            if (!self.translatable_text) {
                return null;
            }

            if (!self.lang) {
                return null;
            }

            return [
                filter(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().lang_id).by_num_eq(self.lang.id),
                filter(TranslationVO.API_TYPE_ID, field_names<TranslationVO>().text_id).by_num_eq(self.translatable_text.id),
            ];
        },
    })
    public translations: TranslationVO[] = null; // TODO FIXME on voudrait être sur un translation directement mais ça pose un pb de conf du syncvo qui est pas prêt pour ça pour le moment

    public text: string = null;
    public semaphore: boolean = true;

    public code_lang: string = VueAppController.getInstance().data_user_lang ? VueAppController.getInstance().data_user_lang.code_lang : null;

    get translation(): TranslationVO {
        if (!this.translations || this.translations.length == 0) {
            return null;
        }

        // Il ne devrait y en avoir qu'une
        return this.translations[0];
    }

    /**
     * Version très simple du remplacement de params qui marchent pour un param à fields de type string ou qui accepte toString
     * @param translation
     */
    get parameterized_text(): string {
        if (!this.text) {
            return '';
        }

        let res: string = this.translation ? this.translation.translated : this.text;

        if (!res) {
            return res;
        }

        if (!this.translation_params) {
            return res;
        }

        for (const i in this.translation_params) {
            const translation_param = this.translation_params[i];

            const regexp = new RegExp('\{' + i + '\}', 'ig');
            res = res.replace(regexp, (translation_param != null) ? translation_param.toString() : 'N/A');
        }

        return res;
    }

    get has_modif(): boolean {

        if (!this.translatable_text) {
            return false;
        }

        if (this.text && !this.translation) {
            return true;
        }

        return this.text != this.translation?.translated;
    }

    @SafeWatch(reflect<InlineTranslatableText>().translation, { immediate: true, deep: true })
    @SafeWatch(reflect<InlineTranslatableText>().code_text)
    @SafeWatch(reflect<InlineTranslatableText>().default_translation)
    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 10,
    })
    public async onchange_translation() {

        if (this.text != (this.translation ? this.translation.translated : this.default_translation || this.code_text)) {
            this.text = this.translation ? this.translation.translated : this.default_translation || this.code_text;
        }
    }

    public async update_trad(translation: string, muted: boolean = false, code_lang: string = null, code_text: string = null) {

        const self = this;

        if ((!this.is_editable) || (!this.semaphore)) {
            return;
        }
        this.semaphore = false;

        if (!code_lang) {
            code_lang = this.code_lang;
        }
        if (!code_text) {
            code_text = this.code_text;
        }

        if (!code_lang) {
            return;
        }
        if (!code_text) {
            return;
        }

        if (!muted) {
            this.snotify.async(self.label('on_page_translation.save_translation.start'), () =>
                new Promise(async (resolve, reject) => {
                    if (!await TranslatableTextController.save_translation(code_lang, code_text, translation)) {
                        reject({
                            body: self.label('on_page_translation.save_translation.ko'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        this.semaphore = true;
                        return;
                    }

                    resolve({
                        body: self.label('on_page_translation.save_translation.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }));
        }

        this.semaphore = true;
    }

    private async lang_changed(lang: LangVO) {

        if (this.code_lang != lang.code_lang) {

            this.code_lang = lang.code_lang;
        }
    }
}