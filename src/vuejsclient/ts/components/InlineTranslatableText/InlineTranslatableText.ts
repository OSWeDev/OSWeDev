import { Component, Prop, Watch } from "vue-property-decorator";
import ModuleTranslation from "../../../../shared/modules/Translation/ModuleTranslation";
import LocaleManager from '../../../../shared/tools/LocaleManager';
import VueAppController from '../../../VueAppController';
import VueComponentBase from "../VueComponentBase";
import './OnPageTranslation.scss';
import TranslatableTextController from "./TranslatableTextController";
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from './TranslatableTextStore';

@Component({
    template: require('./OnPageTranslation.pug')
})
export default class OnPageTranslation extends VueComponentBase {

    @ModuleTranslatableTextGetter
    public get_translations: { [code_lang: string]: { [code_text: string]: string } };

    @ModuleTranslatableTextAction
    public set_translation: (translation: { code_lang: string, code_text: string, value: string }) => void;

    @ModuleTranslatableTextAction
    public set_translations: (translations: { [code_lang: string]: { [code_text: string]: string } }) => void;

    @ModuleTranslatableTextGetter
    public get_initialized: boolean;

    @ModuleTranslatableTextAction
    public set_initialized: (initialized: boolean) => void;

    @ModuleTranslatableTextGetter
    public get_initializing: boolean;

    @ModuleTranslatableTextAction
    public set_initializing: (initializing: boolean) => void;

    @Prop({ default: null })
    private code_text: string = null;

    @Prop({ default: false })
    private is_editable: boolean = false;

    private text: string = null;
    private semaphore: boolean = false;

    @Watch("code_text", { immediate: true })
    private async onchange_code_text() {

        if ((!this.get_initialized) || (this.get_initializing)) {
            return;
        }

        await this.check_existing_bdd_translation();
    }

    private async check_existing_bdd_translation() {
        if (!this.translation) {

            // On a pas la trad pour le moment, mais elle existe peut-etre quand même côté serveur et on a juste pas l'info dans le store
            let lang = await ModuleTranslation.getInstance().getLang(this.code_lang);
            if ((!this.get_translations[this.code_lang]) || (!lang)) {
                // Bon faut pas abuser non plus
                return;
            }

            if (!this.get_translations[this.code_lang][this.code_text]) {
                let text = await ModuleTranslation.getInstance().getTranslatableText(this.code_text);
                if (!text) {
                    // le translatable existe pas donc pas de translation à chercher
                    return;
                }

                let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);
                if (translation) {
                    this.set_translation({ code_lang: this.code_lang, code_text: this.code_text, value: translation.translated });
                }
            }
        }
    }

    private async mounted() {

        if ((!this.get_initialized) && (!this.get_initializing)) {
            this.set_initializing(true);

            this.set_translations(VueAppController.getInstance().ALL_LOCALES);
            await this.check_existing_bdd_translation();

            this.set_initializing(false);
            this.set_initialized(true);
        }

        this.semaphore = true;
    }

    @Watch("translation", { immediate: true })
    private onchange_translation() {

        this.text = this.translation;
    }

    get has_modif(): boolean {
        return this.text != this.translation;
    }

    get code_lang(): string {
        return LocaleManager.getInstance().getDefaultLocale();
    }

    get translation(): string {
        if ((!this.get_translations) || (!this.get_initialized) || (!this.get_translations[this.code_lang]) || (!this.get_translations[this.code_lang][this.code_text])) {
            return null;
        }

        return this.get_translations[this.code_lang][this.code_text];
    }

    private async update_trad() {
        await this.save_translation(this.code_lang, this.code_text, this.text);
    }

    private async save_translation(code_lang: string, code_text: string, translation: string) {

        if ((!this.is_editable) || (!this.semaphore)) {
            return;
        }
        this.semaphore = false;

        this.snotify.info(this.label('on_page_translation.save_translation.start'));

        if (!await TranslatableTextController.getInstance().save_translation(code_lang, code_text, translation)) {
            this.snotify.error(this.label('on_page_translation.save_translation.ko'));
            this.semaphore = true;
            return;
        }

        this.set_translation({ code_lang, code_text, value: translation });
        this.snotify.success(this.label('on_page_translation.save_translation.ok'));
        this.semaphore = true;
    }
}