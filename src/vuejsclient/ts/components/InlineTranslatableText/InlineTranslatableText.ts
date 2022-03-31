import { Component, Prop, Watch } from "vue-property-decorator";
import ModuleTranslation from "../../../../shared/modules/Translation/ModuleTranslation";
import LocaleManager from '../../../../shared/tools/LocaleManager';
import VueAppController from '../../../VueAppController';
import VueComponentBase from "../VueComponentBase";
import './InlineTranslatableText.scss';
import TranslatableTextController from "./TranslatableTextController";
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from './TranslatableTextStore';

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

    private text: string = null;
    private parameterized_text: string = null;
    private semaphore: boolean = false;

    @Watch("code_text", { immediate: true })
    private async onchange_code_text() {

        if ((!this.get_initialized) || (this.get_initializing)) {
            return;
        }

        this.text = this.translation;
        this.parameterized_text = this.get_parameterized_translation(this.text);

        if (!this.code_text) {
            return;
        }

        await this.check_existing_bdd_translation();
    }

    private async check_existing_bdd_translation() {
        if (!this.translation) {

            // On a pas la trad pour le moment, mais elle existe peut-etre quand même côté serveur et on a juste pas l'info dans le store
            let lang = await ModuleTranslation.getInstance().getLang(this.code_lang);
            if (!lang) {
                // Bon faut pas abuser non plus
                return;
            }

            if (!this.get_flat_locale_translations[this.code_text]) {
                let text = await ModuleTranslation.getInstance().getTranslatableText(this.code_text);
                if (!text) {
                    // le translatable existe pas on le crée si on a une trad par défaut
                    if (this.default_translation) {
                        /**
                         * On a une trad par défaut, on la crée
                         */
                        this.text = this.default_translation;
                        await this.update_trad(true);
                    }

                    return;
                }

                let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);
                if (translation) {
                    this.set_flat_locale_translation({ code_text: this.code_text, value: translation.translated });
                    return;
                }

                if (this.default_translation) {
                    /**
                     * On a une trad par défaut, on la crée
                     */
                    this.text = this.default_translation;
                    await this.update_trad(true);
                }
            }
        }
    }

    private async mounted() {

        if ((!this.get_initialized) && (!this.get_initializing)) {
            this.set_initializing(true);

            this.set_flat_locale_translations(VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS);
            await this.check_existing_bdd_translation();

            this.set_initializing(false);
            this.set_initialized(true);
        }

        this.semaphore = true;
    }

    @Watch("translation", { immediate: true })
    private onchange_translation() {

        this.text = this.translation;
        this.parameterized_text = this.get_parameterized_translation(this.text);
    }

    get has_modif(): boolean {
        return this.text != this.translation;
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

        for (let i in this.translation_params) {
            let translation_param = this.translation_params[i];

            let regexp = new RegExp('\{' + i + '\}', 'ig');
            res = res.replace(regexp, (translation_param != null) ? translation_param.toString() : 'N/A');
        }

        return res;
    }

    private async update_trad(muted: boolean = false) {
        await this.save_translation(this.code_lang, this.code_text, this.text, muted);
    }

    private async save_translation(code_lang: string, code_text: string, translation: string, muted: boolean = false) {

        if ((!this.is_editable) || (!this.semaphore)) {
            return;
        }
        this.semaphore = false;

        if (!muted) {
            this.snotify.info(this.label('on_page_translation.save_translation.start'));
        }

        if (!await TranslatableTextController.getInstance().save_translation(code_lang, code_text, translation)) {
            this.snotify.error(this.label('on_page_translation.save_translation.ko'));
            this.semaphore = true;
            return;
        }

        this.set_flat_locale_translation({ code_text, value: translation });
        if (!muted) {
            this.snotify.success(this.label('on_page_translation.save_translation.ok'));
        }
        this.semaphore = true;
    }
}