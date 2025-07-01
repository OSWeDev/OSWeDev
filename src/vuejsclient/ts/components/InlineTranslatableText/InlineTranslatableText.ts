import { Component, Prop, Watch } from "vue-property-decorator";
import Throttle from "../../../../shared/annotations/Throttle";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import EventifyEventListenerConfVO from "../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import ModuleTranslation from "../../../../shared/modules/Translation/ModuleTranslation";
import LangVO from "../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../shared/modules/Translation/vos/TranslationVO";
import LocaleManager from '../../../../shared/tools/LocaleManager';
import { field_names, reflect } from "../../../../shared/tools/ObjectHandler";
import ThrottleHelper from "../../../../shared/tools/ThrottleHelper";
import VueAppController from "../../../VueAppController";
import LangSelectorComponent from "../lang_selector/LangSelectorComponent";
import VueComponentBase from "../VueComponentBase";
import './InlineTranslatableText.scss';
import TranslatableTextController from "./TranslatableTextController";
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from './TranslatableTextStore';

// import { createDecorator } from 'vue-class-component';
// import { applyMetadata } from 'vue-property-decorator/lib/helpers/metadata';

// const MyProp = (options = {}) => {
//     return function (target: any, key: string) {
//         applyMetadata(options, target, key);

//         // Use createDecorator to inject Vue-specific logic
//         createDecorator((componentOptions, k) => {
//             // Define the property as a getter and setter
//             if (!componentOptions.computed) componentOptions.computed = {};

//             // Wrap the property to bind to Vue instance
//             componentOptions.computed[k] = {
//                 get(this: any) {
//                     // 'this' is the Vue instance at runtime
//                     return this[`__${k}`];
//                 },
//                 set(this: any, value: any) {
//                     this[`__${k}`] = value;
//                 },
//             };

//             // Register the property in props if needed
//             (componentOptions.props || (componentOptions.props = {}))[k] = options;
//         })(target, key);
//     };
// };

// /**
//  * decorator of a prop
//  * @param  options the options for the prop
//  * @return PropertyDecorator | void
//  */
// const MyProp = (options) => {
//     if (options === void 0) { options = {}; }
//     return function (a, key) {
//         const target = self;
//         applyMetadata(options, target, key);
//         createDecorator(function (componentOptions, k) {
//             (componentOptions.props || (componentOptions.props = {}))[k] = options;
//         })(target, key);
//     };
// };

// function createPropProxyDecorator(originalDecorator: (...args: any[]) => any) {
//     return function (options?: any): PropertyDecorator {
//         return function (target: object, propertyKey: string | symbol, descriptor?: PropertyDescriptor) {
//             // Appelle le décorateur d'origine avec la configuration utilisateur et les arguments TS
//             originalDecorator(options)(target, propertyKey, descriptor);
//         };
//     };
// }

// function createPropProxyDecorator(factory) {
//     return function (...args: any[]) {
//         let target: any, key: string | symbol | undefined, index: number | undefined;

//         if (args.length === 3) {
//             // Old decorator parameters: (target, key, index)
//             [target, key, index] = args;
//         } else if (args.length === 2 && typeof args[1] === 'object' && 'kind' in args[1]) {
//             // New decorator parameters (TypeScript 5+): (value, context)
//             const [value, context] = args;
//             key = context.name;
//             index = undefined;

//             if (context.kind === 'field' || context.kind === 'method') {
//                 // For instance members, target is the prototype
//                 target = context.static ? value : value.prototype;
//             } else if (context.kind === 'class') {
//                 target = value;
//             } else {
//                 target = undefined;
//             }
//         } else {
//             // Unsupported decorator parameters
//             throw new Error('Unsupported decorator parameters');
//         }

//         const Ctor = typeof target === 'function' ? target : target?.constructor;

//         if (!Ctor) {
//             throw new Error('Unable to determine constructor for decorator');
//         }

//         if (!Ctor.__decorators__) {
//             Ctor.__decorators__ = [];
//         }

//         if (typeof index !== 'number') {
//             index = undefined;
//         }

//         Ctor.__decorators__.push(function (options: any) {
//             return factory(options, key, index);
//         });

//         return undefined;
//     };
// }

// // Crée un décorateur `@Prop` compatible
// const MyProp = createPropProxyDecorator(Prop);

// class test_decorator {
//     @MyProp({ default: null })
//     public code_text_TEST_public: string;

//     @MyProp({ default: null })
//     private code_text_TEST_private: string;
// }

// const test_i = new test_decorator();

@Component({
    template: require('./InlineTranslatableText.pug'),
    components: {
        LangSelectorComponent: LangSelectorComponent,
    }
})
export default class InlineTranslatableText extends VueComponentBase {

    @ModuleTranslatableTextGetter
    public get_flat_locale_translations: { [code_text: string]: string };

    // @ModuleTranslatableTextGetter
    // public initialized: boolean;

    // @ModuleTranslatableTextAction
    // public initialized =  (initialized boolean) => void;

    // @ModuleTranslatableTextGetter
    // public initializing: boolean;

    // @ModuleTranslatableTextAction
    // public initializing =  (initializing boolean) => void;

    // @MyProp({ default: null })
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

    public text: string = null;
    public parameterized_text: string = null;
    public semaphore: boolean = true;

    public lang_id: number = null;
    public code_lang: string = VueAppController.getInstance().data_user_lang ? VueAppController.getInstance().data_user_lang.code_lang : null;

    public initialized: boolean = false;

    public translation: string = null;

    private thottled_check_existing_bdd_translation = ThrottleHelper.declare_throttle_without_args(
        'InlineTranslatableText.thottled_check_existing_bdd_translation',
        this.check_existing_bdd_translation.bind(this), 50);


    get has_modif(): boolean {
        return this.text != this.translation;
    }

    @Watch(reflect<InlineTranslatableText>().get_flat_locale_translations, { deep: true })
    @Watch(reflect<InlineTranslatableText>().translation_params, { immediate: true })
    private async onchange_other_fields() {

        if (!this.initialized) {
            return;
        }

        await this.update_translation();
    }

    @Watch(reflect<InlineTranslatableText>().code_text, { immediate: true })
    private async onchange_code_text() {
        await this.thottled_check_existing_bdd_translation();
    }

    @Watch(reflect<InlineTranslatableText>().translation, { immediate: true })
    private async onchange_translation() {

        this.text = this.translation;
        this.parameterized_text = this.get_parameterized_translation(this.text);
    }

    @Throttle({
        throttle_ms: 100,
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
    })
    private async update_translation() {

        // Si la langue actuelle est celle du user, on peut simplement charger depuis le flat_locale
        if (!VueAppController.getInstance().data_user_lang) {
            if (this.translation != null) {
                this.translation = null;
            }
            return;
        }

        if (this.lang_id == VueAppController.getInstance().data_user_lang.id) {
            if ((!this.get_flat_locale_translations) || (!this.initialized) || (!this.code_text) || (!this.get_flat_locale_translations[this.code_text])) {
                if (this.translation != null) {
                    this.translation = null;
                }

                return;
            }

            /**
             * Appliquer les params
             *  Version simple
             */
            if (this.translation != this.get_flat_locale_translations[this.code_text]) {
                this.translation = this.get_flat_locale_translations[this.code_text];
            }
            return;
        }

        // Sinon, on doit charger depuis la bdd
        const translation = await query(TranslationVO.API_TYPE_ID)
            .filter_by_id(this.lang_id, LangVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, this.code_text, TranslatableTextVO.API_TYPE_ID)
            .select_vo<TranslationVO>();
        this.translation = translation ? translation.translated : this.default_translation;
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
                this.initialized = true;
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
                            this.text = default_translation;
                        }
                        await this.update_trad(default_translation, true, code_lang, code_text);
                    }

                    this.initialized = true;
                    return;
                }

                const translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);
                if (translation) {
                    LocaleManager.set_translation(code_text, known_translation);

                    if (this.translation != (translation ? translation.translated : this.default_translation)) {
                        this.translation = translation ? translation.translated : this.default_translation;
                    }
                    this.initialized = true;
                    return;
                }

                if (default_translation) {
                    /**
                     * On a une trad par défaut, on la crée
                     */
                    if (this.code_text == code_text) {
                        this.text = default_translation;
                    }
                    await this.update_trad(default_translation, true, code_lang, code_text);
                }
            } else {
                const translation = this.get_flat_locale_translations[code_text];

                if (this.translation != translation) {
                    this.translation = translation;
                }
            }
        }
        this.initialized = true;
    }

    private async mounted() {

        if (!this.initialized) {

            this.text = this.translation;
            await this.thottled_check_existing_bdd_translation();
        }
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

                    this.translation = translation;
                    if (this.lang_id == VueAppController.getInstance().data_user_lang.id) {
                        LocaleManager.set_translation(code_text, translation);
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

        if (this.lang_id != lang.id) {

            this.code_lang = lang.code_lang;
            this.lang_id = lang.id;

            await this.update_translation();
        }
    }
}