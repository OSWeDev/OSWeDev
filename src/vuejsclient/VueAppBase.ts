import 'bootstrap';
import "fullcalendar-scheduler";
import "fullcalendar-scheduler/dist/scheduler.min.css";
import "fullcalendar/dist/fullcalendar.min.css";
import "fullcalendar/dist/locale/de.js";
import "fullcalendar/dist/locale/es.js";
import "fullcalendar/dist/locale/fr.js";
import * as moment from 'moment';
import 'quill/dist/quill.bubble.css';
// require styles
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'select2';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';
import FullCalendar from 'vue-full-calendar';
import VueI18n from 'vue-i18n';
import ToggleButton from 'vue-js-toggle-button';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import VueQuillEditor from 'vue-quill-editor';
import * as VueResource from 'vue-resource';
import VueRouter, { RouterOptions } from 'vue-router';
import { RouteConfig } from 'vue-router/types/router';
import vSelect from 'vue-select';
import Snotify from 'vue-snotify';
import { ClientTable } from "vue-tables-2";
import * as vueDropzone from "vue2-dropzone";
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import CacheInvalidationRulesVO from '../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import Module from '../shared/modules/Module';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleWrapper from '../shared/modules/ModuleWrapper';
import LocaleManager from '../shared/tools/LocaleManager';
import IVueModule from '../vuejsclient/ts/modules/IVueModule';
import VueModuleBase from '../vuejsclient/ts/modules/VueModuleBase';
import DefaultHomeComponent from './ts/components/DefaultHome/component/DefaultHomeComponent';
import Error404Component from './ts/components/Error404/component/Error404Component';
import VueComponentBase from './ts/components/VueComponentBase';
import PushDataVueModule from './ts/modules/PushData/PushDataVueModule';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';
import VueAppController from './VueAppController';
import OnPageTranslation from './ts/components/OnPageTranslation/component/OnPageTranslation';

export default abstract class VueAppBase {

    public static instance_: VueAppBase;

    public static getInstance(): VueAppBase {
        return this.instance_;
    }

    public vueInstance: VueComponentBase;
    protected vueRouter: VueRouter;

    protected constructor(
        public appController: VueAppController,
        private initializeModulesDatas: () => {}
    ) {
        VueAppBase.instance_ = this;
    }

    public async runApp() {

        // Chargement des données des modules.
        await this.initializeModulesDatas();

        let self = this;
        let promises = [];

        promises.push(ModuleAjaxCache.getInstance().get('/api/isdev', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED).then((e) => {
            Vue.config.devtools = e ? true : false;
        }));
        promises.push(this.appController.initialize());

        await Promise.all(promises);

        PushDataVueModule.getInstance();

        await this.initializeVueAppModulesDatas();

        // On lance les initializeAsync des modules Vue
        for (let i in ModulesManager.getInstance().modules_by_name) {
            let module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(i, VueModuleBase.IVueModuleRoleName) as VueModuleBase;

            if (module_) {
                await module_.initializeAsync();
            }
        }

        var baseApiUrl = this.appController.data_base_api_url || '';

        let accepted_language = this.appController.SERVER_HEADERS['accept-language'];
        if (accepted_language) {
            accepted_language = accepted_language.split(";")[0].split(",")[0].split("-")[0];
        }

        LocaleManager.getInstance().setDefaultLocale(accepted_language || navigator.language || this.appController.data_default_locale || 'fr');
        let default_locale = LocaleManager.getInstance().getDefaultLocale();
        // let uiDebug = this.appController.data_ui_debug == "1" || window.location.search.indexOf('ui-debug=1') != -1;
        moment.locale(default_locale);

        Vue.use(ClientTable);
        Vue.use(VueI18n);
        LocaleManager.getInstance().i18n = new VueI18n({
            locale: default_locale,
            messages: this.appController.ALL_LOCALES,
            missing: (locale, key, vm) => {
                AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/registerPageTranslation', {
                    translation_code: key,
                    missing: true
                });
            },
        });
        Vue.config['lang'] = default_locale;

        Vue.use(VueResource);

        Vue['http'].interceptors.push(
            function (request, next) {
                request.xhr = {
                    withCredentials: true
                };
                next();
            }
        );

        Vue.config.keyCodes.page_up = 33;
        Vue.config.keyCodes.page_down = 34;

        Vue.filter('hour', {
            read: (value, fractionalDigits) => {
                if (!value) {
                    return value;
                }
                value = value.toString().replace(".", "h");
                return value;
            },
            write: (value) => {
                return value.toString().replace("h", ".");
            }
        } as any);

        Vue.filter('hourCalcul', {
            read: (value) => {
                if (!value) {
                    return value;
                }

                var hourSplit = value.toString().split(".");

                if (hourSplit[1] != null) {
                    hourSplit[1] = Math.round((value - parseInt(hourSplit[0])) * 60);
                } else {
                    hourSplit[1] = "";
                }

                return hourSplit[0] + "h" + hourSplit[1];
            },
            write: (value) => {
                return value.toString().replace("h", ".");
            }
        } as any);

        var routerOptions: RouterOptions = {
            linkActiveClass: "active"
        };

        var normalMode = baseApiUrl == '';

        if (normalMode) {
            routerOptions['history'] = true;
        }

        let routerRoutes: RouteConfig[] = [];
        let moduleWrappersByName: { [key: string]: ModuleWrapper } = ModulesManager.getInstance().getModuleWrappersByName();

        for (let i in moduleWrappersByName) {
            let moduleWrapper: ModuleWrapper = moduleWrappersByName[i];
            let module: Module = moduleWrapper.getModuleComponentByRole(Module.SharedModuleRoleName) as Module;
            let vueModule: IVueModule = moduleWrapper.getModuleComponentByRole(VueModuleBase.IVueModuleRoleName) as IVueModule;

            if (module && module.actif && vueModule && vueModule.routes && (vueModule.routes.length > 0)) {
                routerRoutes = routerRoutes.concat(vueModule.routes);
            }
        }

        routerOptions.routes = routerRoutes;

        let hasHome: boolean = false;
        for (let i in routerOptions.routes) {
            let route = routerOptions.routes[i];
            if (route.path == "/") {
                hasHome = true;
            }
        }
        if (!hasHome) {
            routerOptions.routes.push({
                path: '/',
                name: 'Home',
                component: DefaultHomeComponent
            });
        }

        routerOptions.routes.push({
            path: '*',
            name: '404',
            component: Error404Component
        });

        this.vueRouter = new VueRouter(routerOptions);

        let nbTests = 20;

        function afterEachTransitionHandler(transition) {
            let app: Vue = self.vueRouter.app;

            // JNE : Le temps de charger l'app qui sinon ne l'est pas encore...
            if ((nbTests > 0) && ((!app) || (!app['setPerimeter']))) {
                nbTests--;
                setTimeout(function () {
                    afterEachTransitionHandler(transition);
                }, 100);
                return;
            }

            var params = transition ? (transition.params || {}) : {};

            if (app['setPerimeter']) {
                app['setPerimeter'](params.store_id, params.goal_id);
            }
            if (app['startLoading']) {
                app['startLoading']();
            }
        }

        this.vueRouter.beforeEach((route, redirect, next) => {

            let app: VueComponentBase = self.vueRouter.app as VueComponentBase;

            // Desactivation du bouton print
            AppVuexStoreManager.getInstance().appVuexStore.commit('PRINT_DISABLE');
            AppVuexStoreManager.getInstance().appVuexStore.commit('register_hook_export_data_to_XLSX', null);

            // On nettoie les traductions de la page
            AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/clear');

            // Commencer par nettoyer
            if (document.body.className.match(/ page-[^ ]+/)) {
                document.body.className = document.body.className.replace(/ page-[^ ]+/ig, '');
            }
            if (document.body.className.match(/ isfron[^ ]+/)) {
                document.body.className = document.body.className.replace(/ isfront/ig, '');
            }

            if (route.meta.noSideBar) {
                if (document.body.className.match(/ sidebar-collaps[^ ]+/)) {
                    document.body.className = document.body.className.replace(/ sidebar-collaps[^ ]+/ig, '');
                }
                document.body.className += " sidebar-collapse";
            } else { }

            if (route.name && (route.name != 'home')) {
                document.body.className += " page-" + route.name;
            } else {
                document.body.className += " isfront";
            }

            next();
        });

        this.vueRouter.afterEach(afterEachTransitionHandler);

        Vue.use(VTooltip);
        Vue.use(Snotify);
        Vue.use(VueRouter);
        Vue.use(FullCalendar);
        Vue.use(VueQuillEditor);
        Vue.component('vue-draggable-resizable', VueDraggableResizable);
        Vue.use(ToggleButton);
        Vue.component('multiselect', Multiselect);
        Vue.component('v-select', vSelect);
        Vue.component('on-page-translation', OnPageTranslation);
        Vue.component('vue-dropzone', vueDropzone);
        this.vueInstance = this.createVueMain();
        this.vueInstance.$mount('#vueDIV');

        // this.registerPushWorker();

        window.onbeforeunload = function (e) {
            var e = e || window.event;

            var needsSaving = false;

            if (self.vueRouter && self.vueRouter.app && self.vueRouter.app.$children) {
                for (var i in self.vueRouter.app.$children) {
                    var component = self.vueRouter.app.$children[i];
                    if (component && component['needSaving']) {
                        needsSaving = true;
                    }
                }
            }

            if (needsSaving) {
                var message = "Editing is not saved";
                // For IE and Firefox
                if (e) {
                    e.returnValue = message;
                }
                // For Safari
                return message;
            }
        };
    }

    protected abstract createVueMain(): VueComponentBase;
    protected abstract async initializeVueAppModulesDatas();
    // protected abstract getVAPIDPublicKey(): Uint8Array;

    // private async registerPushWorker() {
    //     const publicVapidKey = this.getVAPIDPublicKey();

    //     if ('serviceWorker' in navigator) {

    //         console.log('Registering service worker');
    //         const registration = await navigator.serviceWorker.
    //             register('sw_push.js', { scope: '/' });
    //         console.log('Registered service worker');

    //         console.log('Registering push');
    //         const subscription = await registration.pushManager.
    //             subscribe({
    //                 userVisibleOnly: true,
    //                 applicationServerKey: publicVapidKey
    //             });
    //         console.log('Registered push');

    //         console.log('Sending push');
    //         await fetch('/subscribepush', {
    //             method: 'POST',
    //             body: JSON.stringify(subscription),
    //             headers: {
    //                 'content-type': 'application/json'
    //             }
    //         });
    //         console.log('Sent push');
    //     }
    // }
}