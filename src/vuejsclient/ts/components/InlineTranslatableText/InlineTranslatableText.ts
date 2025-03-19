import { Component, Prop, Watch } from "vue-property-decorator";
import ModuleTranslation from "../../../../shared/modules/Translation/ModuleTranslation";
import LocaleManager from '../../../../shared/tools/LocaleManager';
import ThrottleHelper from "../../../../shared/tools/ThrottleHelper";
import VueAppController from '../../../VueAppController';
import VueComponentBase from "../VueComponentBase";
import './InlineTranslatableText.scss';
import TranslatableTextController from "./TranslatableTextController";
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from './TranslatableTextStore';
import TranslationVO from "../../../../shared/modules/Translation/vos/TranslationVO";
import { field_names, reflect } from "../../../../shared/tools/ObjectHandler";
import { filter } from "../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import TranslatableTextVO from "../../../../shared/modules/Translation/vos/TranslatableTextVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";

@Component({
    template: require('./InlineTranslatableText.pug')
})
export default class InlineTranslatableText extends VueComponentBase {

    @ModuleTranslatableTextGetter
    public get_flat_locale_translations: { [code_text: string]: string };

    @ModuleTranslatableTextAction
    public set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    @ModuleTranslatableTextAction
    public set_flat_locale_translations: (translations: { [code_text: string]: string }) => void;

    @ModuleTranslatableTextGetter
    public get_initialized: boolean;

    @ModuleTranslatableTextAction
    public set_initialized: (initialized: boolean) => void;

    @ModuleTranslatableTextGetter
    public get_initializing: boolean;

    @ModuleTranslatableTextAction
    public set_initializing: (initializing: boolean) => void;

    @Prop({ default: null })
    private code_text: string;

    @Prop({ default: false })
    private is_editable: boolean;

    @Prop({ default: null })
    private default_translation: string;

    @Prop({ default: null })
    private translation_params: any;

    @Prop({ default: false })
    private textarea: boolean;

    public local_translation: TranslationVO = null;

    private parameterized_text: string = null;
    private semaphore: boolean = false;

    private thottled_check_existing_bdd_translation = ThrottleHelper.declare_throttle_without_args(this.check_existing_bdd_translation.bind(this), 500);

    get has_modif(): boolean {
        return this.local_translation.translated != this.translation;
    }

    get code_lang(): string {
        return LocaleManager.getInstance().getDefaultLocale();
    }

    get translation(): string {
        if ((!this.get_flat_locale_translations) || (!this.get_initialized) || (!this.code_text) || (!this.get_flat_locale_translations[this.code_text])) {
            return null;
        }

        /**
         * Appliquer les params
         *  Version simple
         */
        return this.get_flat_locale_translations[this.code_text];
    }

    @Watch("code_text", { immediate: true })
    @Watch("translation_params", { immediate: true })
    private async onchange_code_text() {

        if ((!this.get_initialized) || (this.get_initializing)) {
            return;
        }

        if (!this.code_text) {
            return;
        }

        const local_translatable_text: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, this.code_text)
            .select_vo();

        this.local_translation = await query(TranslationVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<TranslationVO>().text_id, local_translatable_text.id)
            .select_vo();

        this.local_translation.translated = this.translation;
        this.parameterized_text = this.get_parameterized_translation(this.local_translation.translated);

        await this.thottled_check_existing_bdd_translation();
    }

    @Watch("translation", { immediate: true })
    private async onchange_translation() {

        this.local_translation.translated = this.translation;
        this.parameterized_text = this.get_parameterized_translation(this.local_translation.translated);

        await this.unregister_all_vo_event_callbacks();

        await this.register_single_vo_updates(
            TranslationVO.API_TYPE_ID,
            this.local_translation.id,
            reflect<InlineTranslatableText>().local_translation,
            true,
        );
    }

    private async check_existing_bdd_translation() {

        if (!this.code_text) {
            return;
        }

        const code_text = this.code_text;
        const known_translation = this.translation;
        const default_translation = this.default_translation;
        const code_lang = this.code_lang;

        if (!known_translation) {

            // On a pas la trad pour le moment, mais elle existe peut-etre quand même côté serveur et on a juste pas l'info dans le store
            const lang = await ModuleTranslation.getInstance().getLang(code_lang);
            if (!lang) {
                // Bon faut pas abuser non plus
                return;
            }

            if (!this.get_flat_locale_translations[code_text]) {
                const text = await ModuleTranslation.getInstance().getTranslatableText(code_text);
                if (!text) {
                    // le translatable existe pas on le crée si on a une trad par défaut
                    if (default_translation) {
                        /**
                         * On a une trad par défaut, on la crée
                         */
                        if (this.code_text == code_text) {
                            this.local_translation.translated = default_translation;
                        }
                        await this.update_trad(default_translation, true, code_lang, code_text);
                    }

                    return;
                }

                const translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);
                if (translation) {
                    this.set_flat_locale_translation({ code_text: code_text, value: known_translation });
                    return;
                }

                if (default_translation) {
                    /**
                     * On a une trad par défaut, on la crée
                     */
                    if (this.code_text == code_text) {
                        this.local_translation.translated = default_translation;
                    }
                    await this.update_trad(default_translation, true, code_lang, code_text);
                }
            }
        }
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async mounted() {

        if ((!this.get_initialized) && (!this.get_initializing)) {
            this.set_initializing(true);

            this.set_flat_locale_translations(VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS);
            this.local_translation.translated = this.translation;
            await this.thottled_check_existing_bdd_translation();

            this.set_initializing(false);
            this.set_initialized(true);
        }

        this.semaphore = true;
    }

    /**
     * Version très simple du remplacement de params qui marchent pour un param à fields de type string ou qui accepte toString
     * @param translation
     */
    private get_parameterized_translation(translation: string): string {
        if (!this.translation_params) {
            return translation;
        }

        let res: string = translation;

        if (!res) {
            return res;
        }

        for (const i in this.translation_params) {
            const translation_param = this.translation_params[i];

            const regexp = new RegExp('\{' + i + '\}', 'ig');
            res = res.replace(regexp, (translation_param != null) ? translation_param.toString() : 'N/A');
        }

        return res;
    }

    private async update_trad(translation: string, muted: boolean = false, code_lang: string = null, code_text: string = null) {
        await this.save_translation(translation, muted, code_lang, code_text);
    }

    private async save_translation(translation: string, muted: boolean = false, code_lang: string = null, code_text: string = null) {

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
                    if (!await TranslatableTextController.getInstance().save_translation(code_lang, code_text, translation)) {
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

                    this.set_flat_locale_translation({ code_text: code_text, value: translation });
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
}