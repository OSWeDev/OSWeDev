import { Route } from 'vue-router/types/router';
import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import CacheInvalidationRulesVO from '../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleFeedback from '../shared/modules/Feedback/ModuleFeedback';
import ModuleSurvey from '../shared/modules/Survey/ModuleSurvey';

import TranslationManager from '../shared/modules/Translation/Manager/TranslationManager';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import LangVO from '../shared/modules/Translation/vos/LangVO';
import LocaleManager from '../shared/tools/LocaleManager';
import { all_promises } from '../shared/tools/PromiseTools';
import MenuController from './ts/components/menu/MenuController';
import AjaxCacheClientController from './ts/modules/AjaxCache/AjaxCacheClientController';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import ThrottleHelper from '../shared/tools/ThrottleHelper';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';

export default abstract class VueAppController {

    public static APP_NAME_LOGIN: string = "login";
    public static APP_NAME_CLIENT: string = "client";
    public static APP_NAME_ADMIN: string = "admin";
    /**
     * Ne crée pas d'instance mais permet de récupérer l'instance active
     */
    public static getInstance() {
        return VueAppController.instance_;
    }

    private static instance_: VueAppController;

    public data_ui_debug;
    public data_user_lang: LangVO = null;
    public data_user: UserVO;
    public data_user_roles: RoleVO[] = null;
    // public data_base_api_url;
    public data_default_locale;
    public ALL_LANGS: LangVO[];
    public ALL_LOCALES: any;
    public ALL_FLAT_LOCALE_TRANSLATIONS: { [code_text: string]: string };
    public SERVER_HEADERS;
    public base_url: string;

    public routes_log: Route[] = [];
    // Limite en dur à changer peut-être un jour à voir ou à paramétrer
    public routes_log_limit: number = 101;

    public is_mobile: boolean = false;

    /**
     * Module un peu spécifique qui peut avoir un impact sur les perfs donc on gère son accès le plus vite possible
     */
    public has_access_to_onpage_translation: boolean = false;
    public has_access_to_feedback: boolean = false;
    public has_access_to_survey: boolean = false;

    public throttled_register_translation = ThrottleHelper.getInstance().declare_throttle_with_stackable_args(this.register_translation.bind(this), 1000);

    protected constructor(public app_name: "client" | "admin" | "login") {
        VueAppController.instance_ = this;
    }

    public async initializeFlatLocales() {
        this.ALL_FLAT_LOCALE_TRANSLATIONS = await TranslationManager.get_all_flat_locale_translations();
    }

    public async initialize() {
        let promises = [];
        let self = this;
        let datas;

        this.is_mobile = this.check_is_mobile();

        promises.push((async () => {
            self.base_url = await ModuleDAO.getInstance().getBaseUrl();
        })());

        promises.push((async () => {
            await MenuController.getInstance().reload_from_db();
        })());


        promises.push((async () => {
            self.data_user_roles = await ModuleAccessPolicy.getInstance().getMyRoles();
        })());

        if (ModuleTranslation.getInstance().actif) {
            promises.push((async () => {
                self.has_access_to_onpage_translation = await ModuleAccessPolicy.getInstance().testAccess(ModuleTranslation.POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS);
            })());
        }

        if (ModuleFeedback.getInstance().actif) {

            promises.push((async () => {
                self.has_access_to_feedback = await ModuleAccessPolicy.getInstance().testAccess(ModuleFeedback.POLICY_FO_ACCESS);
            })());
        }

        if (ModuleSurvey.getInstance().actif) {
            promises.push((async () => {
                self.has_access_to_survey = await ModuleAccessPolicy.getInstance().testAccess(ModuleSurvey.POLICY_FO_ACCESS);
            })());
        }

        promises.push((async () => {

            let innerpromises = [];
            innerpromises.push((async () => {
                self.SERVER_HEADERS = JSON.parse(await AjaxCacheClientController.getInstance().get(
                    null, '/api/reflect_headers?v=' + Date.now(), CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) as string);
            })());
            innerpromises.push((async () => {
                self.ALL_LANGS = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
            })());
            innerpromises.push((async () => {
                self.data_user_lang = await ModuleAccessPolicy.getInstance().getMyLang();
            })());
            innerpromises.push((async () => {
                datas = JSON.parse(await AjaxCacheClientController.getInstance().get(null, '/api/clientappcontrollerinit', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) as string);
                self.data_user = (!!datas.data_user) ? datas.data_user : null;
                self.data_ui_debug = datas.data_ui_debug;
                self.data_default_locale = datas.data_default_locale;
            })());
            await all_promises(innerpromises);

            let accepted_language: string = self.SERVER_HEADERS['accept-language'];
            if (accepted_language) {
                accepted_language = accepted_language.split(";")[0].split(",")[0].split("-")[0];
            }

            let user_lang = self.data_user_lang ? self.data_user_lang.code_lang : null;

            let language_found = false;
            if (!!user_lang) {
                let filtered = self.try_language(user_lang);

                if (filtered) {
                    LocaleManager.getInstance().setDefaultLocale(filtered);
                    language_found = true;
                }
            }

            if ((!language_found) && accepted_language) {
                let filtered = self.try_language(accepted_language);

                if (filtered) {
                    LocaleManager.getInstance().setDefaultLocale(filtered);
                    language_found = true;
                }
            }

            if ((!language_found) && navigator.language) {
                let filtered = self.try_language(navigator.language);

                if (filtered) {
                    LocaleManager.getInstance().setDefaultLocale(filtered);
                    language_found = true;
                }
            }

            if ((!language_found) && self.data_default_locale) {
                let filtered = self.try_language(self.data_default_locale);

                if (filtered) {
                    LocaleManager.getInstance().setDefaultLocale(filtered);
                    language_found = true;
                }
            }

            if (!language_found) {
                LocaleManager.getInstance().setDefaultLocale('fr-fr');
            }

            await self.initializeFlatLocales();
            self.ALL_LOCALES = {};

            self.ALL_LOCALES[LocaleManager.getInstance().getDefaultLocale()] = {};
            for (let code_text in self.ALL_FLAT_LOCALE_TRANSLATIONS) {
                let translation = self.ALL_FLAT_LOCALE_TRANSLATIONS[code_text];

                let code_text_split = code_text.split('.');

                let current = self.ALL_LOCALES[LocaleManager.getInstance().getDefaultLocale()];
                for (let j in code_text_split) {
                    let code_text_split_j = code_text_split[j];

                    if (parseInt(j) == (code_text_split.length - 1)) {
                        current[code_text_split_j] = translation;
                    } else {
                        if (!current[code_text_split_j]) {
                            current[code_text_split_j] = {};
                        }
                        current = current[code_text_split_j];
                    }
                }
            }
        })());

        await all_promises(promises);
    }

    public check_is_mobile(): boolean {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || window['opera']);
        return check;
    }

    public hasCodeGoogleAnalytics(code_google_analytics: string) {
        if (!code_google_analytics || !code_google_analytics.length || code_google_analytics == 'null') {
            return false;
        }

        return true;
    }

    public initGoogleAnalytics(code_google_analytics: string) {
        if (!this.hasCodeGoogleAnalytics(code_google_analytics)) {
            return;
        }

        $('head').prepend('<script async src="//www.googletagmanager.com/gtag/js?id=' + code_google_analytics + '"></script>');

    }

    public sendToGoogleAnalytics(page_title: string, page_location: string, page_path: string, code_google_analytics: string) {
        if (!this.hasCodeGoogleAnalytics(code_google_analytics)) {
            return;
        }

        $('head').prepend('<script>' +
            'window.dataLayer = window.dataLayer || [];' +
            'function gtag(){dataLayer.push(arguments);}' +
            'gtag("js", new Date());' +

            'gtag("event", "page_view", {' +
            ' page_title: "' + page_title + '",' +
            ' page_location: "' + page_location + '",' +
            ' page_path: "' + page_path + '",' +
            ' send_to: "' + code_google_analytics + '"' +
            '});' +
            '</script>'
        );
    }

    private try_language(code_lang: string): string {
        /**
         * On tente de filtrer sur les langs existantes
         */
        if (!code_lang) {
            return null;
        }

        let code_lang_separator = (code_lang.indexOf('-') > 0) ? '-' : '_';

        let exact = null;
        let start_exact = null;
        let code_lang_start = (code_lang && (code_lang.indexOf(code_lang_separator) > 0)) ? code_lang.split(code_lang_separator)[0] : code_lang;
        for (let i in this.ALL_LANGS) {
            let lang = this.ALL_LANGS[i];

            if (lang.code_lang.toLowerCase() == code_lang.toLowerCase()) {
                exact = lang;
                break;
            }

            let lang_code_lang_separator = (lang.code_lang.indexOf('-') > 0) ? '-' : '_';
            let lang_start = (lang.code_lang && (lang.code_lang.indexOf(lang_code_lang_separator) > 0)) ? lang.code_lang.split(lang_code_lang_separator)[0] : lang.code_lang;
            if (lang_start.toLowerCase() == code_lang_start.toLowerCase()) {
                start_exact = lang;
            }
        }

        if (exact) {
            return exact.code_lang.toLowerCase();
        } else if (start_exact) {
            return start_exact.code_lang.toLowerCase();
        }
    }

    private register_translation(translations: Array<{ translation_code: string, missing: boolean }>) {
        AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/registerPageTranslations', translations);
    }
}