import VueFlags from "@growthbunker/vueflags";
import 'bootstrap';
import * as  moment from "moment";

import 'select2';
import VCalendar from 'v-calendar';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import VueCookies from 'vue-cookies-ts';
import VueDraggableResizable from 'vue-draggable-resizable';
import VueI18n from 'vue-i18n';
import Intersect from 'vue-intersect';
import VModal from 'vue-js-modal';
import ToggleButton from 'vue-js-toggle-button';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { ColorPicker, ColorPanel } from 'one-colorpicker';
import * as VueResource from 'vue-resource';
import VueRouter, { RouterOptions } from 'vue-router';
import { RouteConfig } from 'vue-router/types/router';
import vSelect from 'vue-select';
import Snotify from 'vue-snotify';
import { ClientTable } from "vue-tables-2";
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import Datepicker from 'vuejs-datepicker';
import ModuleAccessPolicy from "../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import DatatableField from '../shared/modules/DAO/vos/datatable/DatatableField';
import Module from '../shared/modules/Module';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleWrapper from '../shared/modules/ModuleWrapper';
import LangVO from "../shared/modules/Translation/vos/LangVO";
import VOsTypesManager from "../shared/modules/VOsTypesManager";
import EnvHandler from '../shared/tools/EnvHandler';
import LocaleManager from '../shared/tools/LocaleManager';
import PWAController from "./public/pwa/PWAController";
import AlertComponent from './ts/components/alert/AlertComponent';
import ConsoleLogLogger from './ts/components/console_logger/ConsoleLogLogger';
import DroppableVoFieldsController from "./ts/components/dashboard_builder/droppable_vo_fields/DroppableVoFieldsController";
import DocumentStore from './ts/components/document_handler/store/DocumentStore';
import MultipleSelectFilterComponent from './ts/components/multiple_select_filter/MultipleSelectFilterComponent';
import UserNotifsMarkerComponent from './ts/components/notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import VarDirective from './ts/components/Var/directives/var-directive/VarDirective';
import VueComponentBase from './ts/components/VueComponentBase';
import AjaxCacheClientController from './ts/modules/AjaxCache/AjaxCacheClientController';
import IVueModule from './ts/modules/IVueModule';
import PushDataVueModule from './ts/modules/PushData/PushDataVueModule';
import VueModuleBase from './ts/modules/VueModuleBase';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';
import VueAppController from './VueAppController';
import VarsDirective from "./ts/components/Var/directives/vars-directive/VarsDirective";
import VarsClientController from "./ts/components/Var/VarsClientController";
import VarDataBaseVO from "../shared/modules/Var/vos/VarDataBaseVO";
import ConsoleHandler from "../shared/tools/ConsoleHandler";
require('moment-json-parser').overrideDefault();


export default abstract class VueAppBase {

    public static APP_VERSION_COOKIE: string = "app_version";
    public static instance_: VueAppBase;

    public static getInstance(): VueAppBase {
        return this.instance_;
    }

    public vueInstance: VueComponentBase & Vue;
    public vueRouter: VueRouter;

    protected constructor(
        public appController: VueAppController,
        private initializeModulesDatas: () => {}
    ) {
        VueAppBase.instance_ = this;
    }

    public async runApp() {

        ModuleAjaxCache.getInstance().setClientController(AjaxCacheClientController.getInstance());

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
        })());
        promises.push((async () => {
            await this.appController.initialize();
        })());

        await Promise.all(promises);

        PushDataVueModule.getInstance();

        await this.initializeVueAppModulesDatas();

        /**
         * On ajoute tous les types aux DBB
         */
        let types = Object.keys(VOsTypesManager.getInstance().moduleTables_by_voType);
        DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids = {};
        types.forEach((type) =>
            DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[type] = null
        );

        // On commence par demander tous les droits d'accès des modules
        promises = [];
        for (let i in ModulesManager.getInstance().modules_by_name) {
            let module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(i, VueModuleBase.IVueModuleRoleName) as VueModuleBase;

            /**
             * FIXME : peut-etre séparer les policies_tocheck et des policies_totest pour identifier les policies qui manqueraient de façon anormale
             */
            if (module_ && module_.policies_needed && module_.policies_needed.length) {
                promises.push((async () => {

                    let local_promises = [];

                    for (let j in module_.policies_needed) {
                        let policy_name = module_.policies_needed[j];
                        local_promises.push((async () => {
                            module_.policies_loaded[policy_name] = await ModuleAccessPolicy.getInstance().testAccess(policy_name);
                        })());
                    }
                    await Promise.all(local_promises);
                })());
            }
        }
        await Promise.all(promises);

        // On lance les initializeAsync des modules Vue
        for (let i in ModulesManager.getInstance().modules_by_name) {
            let module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(i, VueModuleBase.IVueModuleRoleName) as VueModuleBase;

            if (module_) {
                await module_.initializeAsync();
            }
        }

        await this.postInitializationHook();

        // var baseApiUrl = this.appController.data_base_api_url || '';

        ConsoleLogLogger.getInstance().prepare_console_logger();

        let default_locale = LocaleManager.getInstance().getDefaultLocale();
        // let uiDebug = this.appController.data_ui_debug == "1" || window.location.search.indexOf('ui-debug=1') != -1;
        moment.locale(default_locale);

        Vue.use(ColorPanel);
        Vue.use(ColorPicker);

        Vue.use(ClientTable);
        Vue.use(VueI18n);
        Vue.use(VueCookies);
        LocaleManager.getInstance().i18n = new VueI18n({
            locale: default_locale,
            messages: this.appController.ALL_LOCALES,
            fallbackLocale: this.appController.data_default_locale,
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
                component: () => import(/* webpackChunkName: "DefaultHomeComponent" */ './ts/components/DefaultHome/component/DefaultHomeComponent')
            });
        }

        routerOptions.routes.push({
            path: '/me',
            name: 'MyAccount',
            component: () => import(/* webpackChunkName: "AccessPolicyMyAccountComponent" */ './login/AccessPolicy/my_account/AccessPolicyMyAccountComponent')
        });

        routerOptions.routes.push({
            path: '*',
            name: '404',
            component: () => import(/* webpackChunkName: "Error404Component" */ './ts/components/Error404/component/Error404Component')
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

        let code_google_analytics: string = EnvHandler.getInstance().CODE_GOOGLE_ANALYTICS;

        VueAppController.getInstance().initGoogleAnalytics(code_google_analytics);

        this.vueRouter.beforeEach((route, redirect, next) => {
            VueAppController.getInstance().sendToGoogleAnalytics(
                route.name,
                route.fullPath,
                route.fullPath,
                code_google_analytics
            );

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
            // AppVuexStoreManager.getInstance().appVuexStore.commit('OnPageTranslationStore/clear');

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

            // Si on a pas la même version entre le front et le back, on redirige vers la page de mise à jour
            if (!this.checkAppVersion()) {
                return;
            }

            next();
        });

        this.vueRouter.afterEach(afterEachTransitionHandler);

        Vue.use(VTooltip, { boundary: 'body' });
        Vue.use(Snotify);
        Vue.use(VueRouter);
        Vue.use(VueFlags, {
            iconPath: '/client/public/img/flags/',
        });

        // Use v-calendar, v-date-picker & v-popover components
        Vue.use(VCalendar, {
            firstDayOfWeek: 2,
            locale: default_locale
        });

        Vue.component('vue-draggable-resizable', VueDraggableResizable);
        Vue.use(ToggleButton);
        Vue.use(VModal);
        Vue.component('Vuequilleditor', async () => (await import(/* webpackChunkName: "quillEditor" */  'vue-quill-editor')).quillEditor);
        Vue.component('Usernotifsmarkercomponent', UserNotifsMarkerComponent);
        Vue.component('multiselect', Multiselect);
        Vue.component('v-select', vSelect);
        Vue.component('v-slider', async () => (await import(/* webpackChunkName: "VueSlider" */  'vue-slider-component')));
        Vue.component('vue-dropzone', async () => (await import(/* webpackChunkName: "Vue2Dropzone" */  'vue2-dropzone')));
        Vue.component('var-data', () => import(/* webpackChunkName: "VarDataRefComponent" */ './ts/components/Var/components/dataref/VarDataRefComponent'));
        Vue.component('vars-sum', () => import(/* webpackChunkName: "VarDataSumComponent" */ './ts/components/Var/components/datasum/VarDataSumComponent'));
        Vue.component('vars-data', () => import(/* webpackChunkName: "VarDatasRefsComponent" */ './ts/components/Var/components/datasrefs/VarDatasRefsComponent'));
        Vue.component('var-desc', () => import(/* webpackChunkName: "VarDescComponent" */ './ts/components/Var/components/desc/VarDescComponent'));
        Vue.component('var-if', () => import(/* webpackChunkName: "VarDataIfComponent" */ './ts/components/Var/components/varif/VarDataIfComponent'));
        // Vue.component('var-bar-chart', () => import(/* webpackChunkName: "VarDataBarChartComponent" */ './ts/components/Var/components/databarchart/VarDataBarChartComponent'));
        Vue.component('vars-bar-chart', () => import(/* webpackChunkName: "VarDatasBarChartComponent" */ './ts/components/Var/components/datasbarchart/VarDatasBarChartComponent'));
        Vue.component('var-pie-chart', () => import(/* webpackChunkName: "VarPieChartComponent" */ './ts/components/Var/components/piechart/VarPieChartComponent'));
        Vue.component('Resizableimg', () => import(/* webpackChunkName: "ResizableImageComponent" */ './ts/components/resizable_img/ResizableImageComponent'));
        Vue.component('Intersect', Intersect);
        Vue.component('Crudcomponentfield', () => import(/* webpackChunkName: "CRUDComponentField" */ './ts/components/crud/component/field/CRUDComponentField'));
        Vue.component('Multipleselectfiltercomponent', MultipleSelectFilterComponent);
        Vue.component('Datepicker', Datepicker);
        Vue.component('Alertcomponent', AlertComponent);
        Vue.component('Numrangecomponent', () => import(/* webpackChunkName: "NumRangeComponent" */ './ts/components/ranges/numrange/NumRangeComponent'));
        Vue.component('Numrangescomponent', () => import(/* webpackChunkName: "NumRangesComponent" */ './ts/components/ranges/numranges/NumRangesComponent'));
        Vue.component('Tsrangecomponent', () => import(/* webpackChunkName: "TSRangeComponent" */ './ts/components/ranges/tsrange/TSRangeComponent'));
        Vue.component('Tsrangescomponent', () => import(/* webpackChunkName: "TSRangesComponent" */ './ts/components/ranges/tsranges/TSRangesComponent'));
        Vue.component('Hourrangecomponent', () => import(/* webpackChunkName: "HourRangeComponent" */ './ts/components/ranges/hourrange/HourRangeComponent'));
        Vue.component('Hourrangescomponent', () => import(/* webpackChunkName: "HourRangesComponent" */ './ts/components/ranges/hourranges/HourRangesComponent'));

        Vue.directive('var-directive', VarDirective.getInstance());
        Vue.directive('vars-directive', VarsDirective.getInstance());

        AppVuexStoreManager.getInstance().registerModule(DocumentStore.getInstance());

        this.vueInstance = this.createVueMain();
        this.vueInstance.$mount('#vueDIV');

        // Si on a pas la même version entre le front et le back, on redirige vers la page de mise à jour
        if (!this.checkAppVersion(false)) {
            return;
        }

        await this.postMountHook();

        let app_name: "client" | "admin" | "login" = this.appController.app_name;

        if (EnvHandler.getInstance().ACTIVATE_PWA && ((app_name == "client") || (app_name == "login"))) {
            await PWAController.getInstance().initialize_pwa(
                '/vuejsclient/public/pwa/' + app_name + '-sw.' + EnvHandler.getInstance().VERSION + '.js'
            );
        }
        // this.registerPushWorker();

        window.onbeforeunload = (e) => {
            var e = e || window.event;

            // ConsoleHandler.getInstance().log('onbeforeunload');

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

            self.unregisterVarsBeforeUnload().then().catch((err) => ConsoleHandler.getInstance().error(err));

            return null;
        };
    }

    protected abstract createVueMain(): VueComponentBase;
    protected abstract initializeVueAppModulesDatas(): Promise<any>;
    protected async postInitializationHook() { }
    protected async postMountHook() { }

    /**
     *
     * @returns false si on a pas la même version entre le front et le back, true sinon
     */
    protected checkAppVersion(reload_window: boolean = true): boolean {
        if (!this.vueInstance) {
            return true;
        }

        if (EnvHandler.getInstance().VERSION != this.vueInstance.$cookies.get(VueAppBase.APP_VERSION_COOKIE)) {
            this.vueInstance.$cookies.set(VueAppBase.APP_VERSION_COOKIE, EnvHandler.getInstance().VERSION);

            if (reload_window) {
                this.vueInstance.$snotify.warning(
                    this.vueInstance.label("app_version_changed"),
                    { timeout: 3000 }
                );

                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return false;
            }
        }

        return true;
    }

    protected async unregisterVarsBeforeUnload() {
        if (VarsClientController.getInstance().registered_var_params) {
            let params: VarDataBaseVO[] = [];
            for (let i in VarsClientController.getInstance().registered_var_params) {
                let wrapper = VarsClientController.getInstance().registered_var_params[i];
                params.push(wrapper.var_param);
            }
            if (params.length) {
                await VarsClientController.getInstance().unRegisterParams(params);
            }
        }
    }
}