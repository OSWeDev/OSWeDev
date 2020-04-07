import CRUDComponentField from './ts/components/crud/component/field/CRUDComponentField.vue';
import VarDataRefComponent from './ts/components/Var/components/dataref/VarDataRefComponent';
import VarDataSumComponent from './ts/components/Var/components/datasum/VarDataSumComponent';
import VarDatasRefsComponent from './ts/components/Var/components/datasrefs/VarDatasRefsComponent';
import VarDescComponent from './ts/components/Var/components/desc/VarDescComponent';
import VarDataIfComponent from './ts/components/Var/components/varif/VarDataIfComponent';
import VarDataBarChartComponent from './ts/components/Var/components/databarchart/VarDataBarChartComponent';
import VarPieChartComponent from './ts/components/Var/components/piechart/VarPieChartComponent';
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
import VCalendar from 'v-calendar';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import FullCalendar from 'vue-full-calendar';
import VueI18n from 'vue-i18n';
import ToggleButton from 'vue-js-toggle-button';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import VueQuillEditor from 'vue-quill-editor';
import * as VueResource from 'vue-resource';
import VueRouter, { RouterOptions } from 'vue-router';
import { RouteConfig } from 'vue-router/types/router';
import Snotify from 'vue-snotify';
import { ClientTable } from "vue-tables-2";
import * as vueDropzone from "vue2-dropzone";
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import DatatableField from '../shared/modules/DAO/vos/datatable/DatatableField';
import Module from '../shared/modules/Module';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleWrapper from '../shared/modules/ModuleWrapper';
import EnvHandler from '../shared/tools/EnvHandler';
import LocaleManager from '../shared/tools/LocaleManager';
import IVueModule from '../vuejsclient/ts/modules/IVueModule';
import VueModuleBase from '../vuejsclient/ts/modules/VueModuleBase';
import ConsoleLogLogger from './ts/components/console_logger/ConsoleLogLogger';
import VarDirective from './ts/components/Var/directives/var-directive/VarDirective';
import VueComponentBase from './ts/components/VueComponentBase';
import PushDataVueModule from './ts/modules/PushData/PushDataVueModule';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';
import VueAppController from './VueAppController';

require('moment-json-parser').overrideDefault();

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

        DatatableField.VueAppBase = this;

        let self = this;
        let promises = [];

        promises.push((async () => {
            Vue.config.devtools = false;
            if (EnvHandler.getInstance().IS_DEV) {
                Vue.config.devtools = true;
            }
            // if (!!await ModuleAjaxCache.getInstance().get('/api/isdev', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED)) {
            //     Vue.config.devtools = true;
            // }
        })());
        promises.push((async () => {
            await this.appController.initialize();
        })());

        await Promise.all(promises);

        PushDataVueModule.getInstance();

        await this.initializeVueAppModulesDatas();

        // On lance les initializeAsync des modules Vue
        promises = [];
        for (let i in ModulesManager.getInstance().modules_by_name) {
            let module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(i, VueModuleBase.IVueModuleRoleName) as VueModuleBase;

            if (module_) {
                promises.push((async () => {
                    await module_.initializeAsync();
                })());
            }
        }
        await Promise.all(promises);

        await this.postInitializationHook();

        // var baseApiUrl = this.appController.data_base_api_url || '';

        let accepted_language = this.appController.SERVER_HEADERS['accept-language'];
        if (accepted_language) {
            accepted_language = accepted_language.split(";")[0].split(",")[0].split("-")[0];
        }

        let user_lang = VueAppController.getInstance().data_user_lang ? VueAppController.getInstance().data_user_lang.code_lang : null;

        ConsoleLogLogger.getInstance().prepare_console_logger();

        LocaleManager.getInstance().setDefaultLocale(user_lang || accepted_language || navigator.language || this.appController.data_default_locale || 'fr');
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

        /* Test suppression baseApiUrl var normalMode = baseApiUrl == '';

        if (normalMode) {*/
        routerOptions['history'] = true;
        //}

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
                component: () => import('./ts/components/DefaultHome/component/DefaultHomeComponent')
            });
        }

        routerOptions.routes.push({
            path: '*',
            name: '404',
            component: () => import('./ts/components/Error404/component/Error404Component')
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

            if (VueAppController.getInstance().routes_log.length >= VueAppController.getInstance().routes_log_limit) {
                VueAppController.getInstance().routes_log.shift();
            }
            VueAppController.getInstance().routes_log.push(route);

            let app: VueComponentBase = self.vueRouter.app as VueComponentBase;

            // Desactivation du bouton print
            AppVuexStoreManager.getInstance().appVuexStore.commit('PRINT_DISABLE');
            AppVuexStoreManager.getInstance().appVuexStore.commit('register_hook_export_data_to_XLSX', null);
            AppVuexStoreManager.getInstance().appVuexStore.commit('register_print_component', null);
            AppVuexStoreManager.getInstance().appVuexStore.commit('set_onprint', null);

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

        // Use v-calendar, v-date-picker & v-popover components
        Vue.use(VCalendar, {
            firstDayOfWeek: 2,
            locale: default_locale
        });

        // Vue.use(ToggleButton);
        // Vue.component('vue-draggable-resizable', () => import('vue-draggable-resizable'));
        // Vue.component('UserNotifsMarkerComponent', () => import('./ts/components/notification/components/UserNotifsMarker/UserNotifsMarkerComponent'));
        // Vue.component('multiselect', () => import('vue-multiselect'));
        // Vue.component('v-select', () => import('vue-select'));
        // Vue.component('vue-dropzone', vueDropzone);
        // Vue.component('var-data', () => import('./ts/components/Var/components/dataref/VarDataRefComponent'));
        // Vue.component('vars-sum', () => import('./ts/components/Var/components/datasum/VarDataSumComponent'));
        // Vue.component('vars-data', () => import('./ts/components/Var/components/datasrefs/VarDatasRefsComponent'));
        // Vue.component('var-desc', () => import('./ts/components/Var/components/desc/VarDescComponent'));
        // Vue.component('var-if', () => import('./ts/components/Var/components/varif/VarDataIfComponent'));
        // Vue.component('var-bar-chart', () => import('./ts/components/Var/components/databarchart/VarDataBarChartComponent'));
        // Vue.component('var-pie-chart', () => import('./ts/components/Var/components/piechart/VarPieChartComponent'));
        // Vue.component('Intersect', () => import('vue-intersect'));
        // Vue.component('CRUDComponentField', () => import('./ts/components/crud/component/field/CRUDComponentField.vue'));
        // Vue.component('MultipleSelectFilterComponent', () => import('./ts/components/multiple_select_filter/MultipleSelectFilterComponent'));
        // Vue.component('Datepicker', () => import('vuejs-datepicker'));
        // Vue.component('AlertComponent', () => import('./ts/components/alert/AlertComponent'));
        // Vue.directive('var-directive', VarDirective.getInstance());

        Vue.use(ToggleButton);
        Vue.component('vue-draggable-resizable', () => import('vue-draggable-resizable'));
        Vue.component('UserNotifsMarkerComponent', () => import('./ts/components/notification/components/UserNotifsMarker/UserNotifsMarkerComponent'));
        Vue.component('multiselect', () => import('vue-multiselect'));
        Vue.component('v-select', () => import('vue-select'));
        Vue.component('vue-dropzone', vueDropzone);
        Vue.component('var-data', VarDataRefComponent);
        Vue.component('vars-sum', VarDataSumComponent);
        Vue.component('vars-data', VarDatasRefsComponent);
        Vue.component('var-desc', VarDescComponent);
        Vue.component('var-if', VarDataIfComponent);
        Vue.component('var-bar-chart', VarDataBarChartComponent);
        Vue.component('var-pie-chart', VarPieChartComponent);
        Vue.component('Intersect', () => import('vue-intersect'));
        Vue.component('CRUDComponentField', CRUDComponentField);
        Vue.component('MultipleSelectFilterComponent', () => import('./ts/components/multiple_select_filter/MultipleSelectFilterComponent'));
        Vue.component('Datepicker', () => import('vuejs-datepicker'));
        Vue.component('AlertComponent', () => import('./ts/components/alert/AlertComponent'));
        Vue.directive('var-directive', VarDirective.getInstance());

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
    protected async postInitializationHook() { }
}