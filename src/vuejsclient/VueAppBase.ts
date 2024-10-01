import VueFlags from "@growthbunker/vueflags";
import 'bootstrap';
import $ from 'jquery';
import moment from 'moment';

import { ColorPanel, ColorPicker } from 'one-colorpicker';
import 'select2';
import VCalendar from 'v-calendar';
import 'v-calendar/lib/v-calendar.min.css';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import VueCookies from 'vue-cookies-ts';
import VueDraggableResizable from 'vue-draggable-resizable';
import VueI18n from 'vue-i18n';
import VModal from 'vue-js-modal';
import ToggleButton from 'vue-js-toggle-button';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { quillEditor } from 'vue-quill-editor';
import VueResource from 'vue-resource';
import VueRouter, { RouterOptions } from 'vue-router';
import { RouteConfig } from 'vue-router/types/router';
import vSelect from 'vue-select';
import Snotify from 'vue-snotify';
import { ClientTable } from "vue-tables-2";
import 'vue2-dropzone/dist/vue2Dropzone.min.css';
import Datepicker from 'vuejs-datepicker';
import VueQuarterSelect from '@3scarecrow/vue-quarter-select';
import ModuleAccessPolicy from "../shared/modules/AccessPolicy/ModuleAccessPolicy";
import ModuleTableController from "../shared/modules/DAO/ModuleTableController";
import DatatableField from '../shared/modules/DAO/vos/datatable/DatatableField';
import Dates from "../shared/modules/FormatDatesNombres/Dates/Dates";
import Module from '../shared/modules/Module';
import ModuleWrapper from '../shared/modules/ModuleWrapper';
import ModulesManager from '../shared/modules/ModulesManager';
import StatsController from "../shared/modules/Stats/StatsController";
import ModuleSuiviCompetences from "../shared/modules/SuiviCompetences/ModuleSuiviCompetences";
import VarDataBaseVO from "../shared/modules/Var/vos/VarDataBaseVO";
import ConsoleHandler from "../shared/tools/ConsoleHandler";
import EnvHandler from '../shared/tools/EnvHandler';
import LocaleManager from '../shared/tools/LocaleManager';
import { all_promises } from "../shared/tools/PromiseTools";
import VueAppController from './VueAppController';
import PWAController from "./public/pwa/PWAController";
import SuiviCompetencesVueController from "./ts/components/SuiviCompetences/SuiviCompetencesVueController";
import VarsClientController from "./ts/components/Var/VarsClientController";
import VarDirective from './ts/components/Var/directives/var-directive/VarDirective';
import VarsDirective from "./ts/components/Var/directives/vars-directive/VarsDirective";
import VueComponentBase from './ts/components/VueComponentBase';
import AlertComponent from './ts/components/alert/AlertComponent';
import AlertsListContainerComponent from "./ts/components/alert/AlertsListContainerComponent";
import ConsoleLogLogger from './ts/components/console_logger/ConsoleLogLogger';
import DroppableVoFieldsController from "./ts/components/dashboard_builder/droppable_vo_fields/DroppableVoFieldsController";
import DocumentStore from './ts/components/document_handler/store/DocumentStore';
import MultipleSelectFilterComponent from './ts/components/multiple_select_filter/MultipleSelectFilterComponent';
import UserNotifsMarkerComponent from './ts/components/notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import IVueModule from './ts/modules/IVueModule';
import PushDataVueModule from './ts/modules/PushData/PushDataVueModule';
import StatsVueModule from "./ts/modules/Stats/StatsVueModule";
import VueModuleBase from './ts/modules/VueModuleBase';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';

// const loadComponent = async (component) => {
//     try {
//         return await import(`@/components/${component}.vue`);
//     } catch (err) {
//         if (err.message.includes("Failed to fetch dynamically imported module")) {
//             window.location.reload(true); // force reload to bypass cache
//         }
//     }
// };

export default abstract class VueAppBase {

    public static instance_: VueAppBase;

    public vueInstance: VueComponentBase & Vue;
    public vueRouter: VueRouter;

    protected constructor(
        public appController: VueAppController,
        private initializeModulesDatas: () => Promise<unknown>,
    ) {
        VueAppBase.instance_ = this;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): VueAppBase {
        return this.instance_;
    }

    public async runApp() {

        ConsoleHandler.init();

        // Chargement des données des modules.
        await this.initializeModulesDatas();

        DatatableField.VueAppBase = this;

        const self = this;
        let promises = [];

        Vue.config.devtools = false;
        if (EnvHandler.is_dev) {
            Vue.config.devtools = true;
        }

        promises.push((async () => {
            await this.appController.initialize();
        })());

        await all_promises(promises);

        PushDataVueModule.getInstance();

        StatsVueModule.getInstance();

        await this.initializeVueAppModulesDatas();

        /**
         * On ajoute tous les types aux DBB
         */
        const types = Object.keys(ModuleTableController.module_tables_by_vo_type);
        DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids = {};
        types.forEach((type) =>
            DroppableVoFieldsController.getInstance().visible_fields_and_api_type_ids[type] = null,
        );

        const modules_by_name = ModulesManager.getInstance().modules_by_name;

        // On commence par demander tous les droits d'accès des modules
        promises = [];
        for (const module_name in modules_by_name) {
            const module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(
                module_name,
                VueModuleBase.IVueModuleRoleName,
            ) as VueModuleBase;

            /**
             * FIXME : peut-etre séparer les policies_tocheck et des policies_totest pour identifier les policies qui manqueraient de façon anormale
             */
            if (module_?.policies_needed?.length > 0) {
                promises.push((async () => {

                    const local_promises = [];

                    for (const j in module_.policies_needed) {
                        const policy_name = module_.policies_needed[j];

                        local_promises.push((async () => {
                            module_.policies_loaded[policy_name] = await ModuleAccessPolicy.getInstance().testAccess(policy_name);
                        })());
                    }

                    await all_promises(local_promises);
                })());
            }
        }
        await all_promises(promises);

        // On lance les initializeAsync des modules Vue
        for (const module_name in modules_by_name) {
            const module_: VueModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(
                module_name,
                VueModuleBase.IVueModuleRoleName,
            ) as VueModuleBase;

            if (module_) {
                await module_.initializeAsync();
            }
        }

        await this.postInitializationHook();

        // var baseApiUrl = this.appController.data_base_api_url || '';

        ConsoleLogLogger.getInstance().prepare_console_logger();

        const default_locale = LocaleManager.getInstance().getDefaultLocale();
        // let uiDebug = this.appController.data_ui_debug == "1" || window.location.search.indexOf('ui-debug=1') != -1;
        moment.locale(default_locale);

        // Vue.config.errorHandler = function (err, vm, info) {
        //     if (err.message.includes("Failed to fetch dynamically imported module")) {
        //         ConsoleHandler.error(err + " - " + info + " - Reloading page");
        //         window.location.reload();
        //     }
        // };

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
                VueAppController.getInstance().throttled_register_translation({
                    translation_code: key,
                    missing: true,
                });
            },
            silentTranslationWarn: true,
        });
        // TODO : il faudrait probablement forcer ce param côté client non ? LocaleManager.getInstance().i18n.nsSeparator = '¤';
        Vue.config['lang'] = default_locale;

        Vue.use(VueResource);

        Vue['http'].interceptors.push(
            function (request, next) {
                request.xhr = {
                    withCredentials: true,
                };
                next();
            },
        );

        // Vu avec MDE -> on laisse le script en load public pour le moment sinon il faut faire la modification dans tous les projets
        const fontawesome = document.createElement("script");
        fontawesome.setAttribute(
            "src",
            "//kit.fontawesome.com/26085407f2.js",
        );
        document.head.appendChild(fontawesome);

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
            },
        } as any);

        Vue.filter('hourCalcul', {
            read: (value) => {
                if (!value) {
                    return value;
                }

                const hourSplit = value.toString().split(".");

                if (hourSplit[1] != null) {
                    hourSplit[1] = Math.round((value - parseInt(hourSplit[0])) * 60);
                } else {
                    hourSplit[1] = "";
                }

                return hourSplit[0] + "h" + hourSplit[1];
            },
            write: (value) => {
                return value.toString().replace("h", ".");
            },
        } as any);

        const routerOptions: RouterOptions = {
            linkActiveClass: "active",
        };

        /* Test suppression baseApiUrl var normalMode = baseApiUrl == '';

        if (normalMode) {*/
        routerOptions['history'] = true;
        //}

        let routerRoutes: RouteConfig[] = [];
        const moduleWrappersByName: { [key: string]: ModuleWrapper } = ModulesManager.getInstance().getModuleWrappersByName();

        for (const i in moduleWrappersByName) {
            const moduleWrapper: ModuleWrapper = moduleWrappersByName[i];
            const module: Module = moduleWrapper.getModuleComponentByRole(Module.SharedModuleRoleName) as Module;
            const vueModule: IVueModule = moduleWrapper.getModuleComponentByRole(VueModuleBase.IVueModuleRoleName) as IVueModule;

            if (module && module.actif && vueModule && vueModule.routes && (vueModule.routes.length > 0)) {
                routerRoutes = routerRoutes.concat(vueModule.routes);
            }
        }

        routerOptions.routes = routerRoutes;

        let hasHome: boolean = false;
        for (const i in routerOptions.routes) {
            const route = routerOptions.routes[i];
            if (route.path == "/") {
                hasHome = true;
            }
        }
        if (!hasHome) {
            routerOptions.routes.push({
                path: '/',
                name: 'Home',
                component: () => import('./ts/components/DefaultHome/component/DefaultHomeComponent'),
            });
        }

        routerOptions.routes.push({
            path: '/me',
            name: 'MyAccount',
            component: () => import('./login/AccessPolicy/my_account/AccessPolicyMyAccountComponent'),
        });

        routerOptions.routes.push({
            path: '/action_url_cr/:action_url_id',
            name: 'ActionURLCR',
            component: () => import('./ts/components/action_url_cr/ActionURLCRComponent'),
            props: (route) => ({
                action_url_id: route.params.action_url_id,
            }),
        });

        routerOptions.routes.push({
            path: '*',
            name: '404',
            component: () => import('./ts/components/Error404/component/Error404Component'),
        });

        this.vueRouter = new VueRouter(routerOptions);

        let nbTests = 20;
        let time_in_router: number = 0;

        function afterEachTransitionHandler(transition) {
            const app: Vue = self.vueRouter.app;

            if (time_in_router) {
                const time = Dates.now_ms() - time_in_router;
                time_in_router = 0;
                StatsController.register_stat_DUREE('Vue_router', 'afterEachTransitionHandler', transition.name, time);
            }

            // JNE : Le temps de charger l'app qui sinon ne l'est pas encore...
            if ((nbTests > 0) && ((!app) || (!app['setPerimeter']))) {
                nbTests--;
                setTimeout(function () {
                    afterEachTransitionHandler(transition);
                }, 100);
                return;
            }

            const params = transition ? (transition.params || {}) : {};

            if (app['setPerimeter']) {
                app['setPerimeter'](params.store_id, params.goal_id);
            }
            if (app['startLoading']) {
                app['startLoading']();
            }
        }

        const code_google_analytics: string = EnvHandler.code_google_analytics;

        VueAppController.getInstance().initGoogleAnalytics(code_google_analytics);

        this.vueRouter.beforeEach((route, redirect, next) => {

            time_in_router = Dates.now_ms();
            if (route.name) {
                StatsController.register_stat_COMPTEUR('Vue_router', 'beforeEach', route.name);
            }

            VueAppController.getInstance().sendToGoogleAnalytics(
                route.name,
                route.fullPath,
                route.fullPath,
                code_google_analytics,
            );

            if (VueAppController.getInstance().routes_log.length >= VueAppController.getInstance().routes_log_limit) {
                VueAppController.getInstance().routes_log.shift();
            }
            VueAppController.getInstance().routes_log.push(route);

            const app: VueComponentBase = self.vueRouter.app as VueComponentBase;

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
            }

            if (route.name && (route.name != 'home')) {
                document.body.className += " page-" + route.name;
            } else {
                document.body.className += " isfront";
            }

            next();
        });

        this.vueRouter.afterEach(afterEachTransitionHandler);

        // Nouvelle tentative d'intercepter les erreurs de navigation et de reload la page dans ce cas
        const wrapped_vue_router_push = this.vueRouter.push.bind(this.vueRouter);
        this.vueRouter.push = (location, onComplete?, onAbort?) => {
            try {
                wrapped_vue_router_push(location, onComplete, onAbort);
            } catch (error) {

                if (error.message.includes("Failed to fetch dynamically imported module")) {
                    ConsoleHandler.error(error + " - Reloading page");
                    window.location.reload();
                }
            }
        };

        Vue.use(VTooltip, { boundary: 'body' });
        Vue.use(Snotify);
        Vue.use(VueRouter);
        Vue.use(VueFlags, {
            iconPath: '/client/public/img/flags/',
        });

        // Use v-calendar, v-date-picker & v-popover components
        Vue.use(VCalendar, {
            firstDayOfWeek: 2,
            locale: default_locale,
        });

        Vue.component('vue-draggable-resizable', VueDraggableResizable);
        Vue.use(ToggleButton);
        Vue.use(VModal);
        Vue.component('Vuequilleditor', quillEditor);
        Vue.component('Usernotifsmarkercomponent', UserNotifsMarkerComponent);
        Vue.component('multiselect', Multiselect);
        Vue.component('v-select', vSelect);
        Vue.component('v-slider', async () => (await import('vue-slider-component')));
        Vue.component('vue-dropzone', async () => (await import('vue2-dropzone')));
        Vue.component('var-data', () => import('./ts/components/Var/components/dataref/VarDataRefComponent'));
        // Vue.component('vars-sum', () => import('./ts/components/Var/components/datasum/VarDataSumComponent'));
        Vue.component('vars-data', () => import('./ts/components/Var/components/datasrefs/VarDatasRefsComponent'));
        Vue.component('var-desc', () => import('./ts/components/Var/components/desc/VarDescComponent'));
        Vue.component('var-if', () => import('./ts/components/Var/components/varif/VarDataIfComponent'));
        // Vue.component('var-bar-chart', () => import('./ts/components/Var/components/databarchart/VarDataBarChartComponent'));
        Vue.component('vars-bar-chart', () => import('./ts/components/Var/components/datasbarchart/VarDatasBarChartComponent'));
        Vue.component('var-pie-chart', () => import('./ts/components/Var/components/piechart/VarPieChartComponent'));
        Vue.component('var-choropleth-chart', () => import('./ts/components/Var/components/choropleth-chart/VarChoroplethChartComponent'));
        Vue.component('var-mixed-charts', () => import('./ts/components/Var/components/mixed-chart/VarMixedChartComponent'));
        Vue.component('var-radar-chart', () => import('./ts/components/Var/components/radar-chart/VarRadarChartComponent'));
        Vue.component('Resizableimg', () => import('./ts/components/resizable_img/ResizableImageComponent'));
        Vue.component('Crudcomponentfield', () => import('./ts/components/crud/component/field/CRUDComponentField'));
        Vue.component('Multipleselectfiltercomponent', MultipleSelectFilterComponent);
        Vue.component('Datepicker', Datepicker);
        Vue.component('Vuequarterselect', VueQuarterSelect);
        Vue.component('Alertcomponent', AlertComponent);
        Vue.component('Alertslistcontainercomponent', AlertsListContainerComponent);
        Vue.component('Numrangecomponent', () => import('./ts/components/ranges/numrange/NumRangeComponent'));
        Vue.component('Numrangescomponent', () => import('./ts/components/ranges/numranges/NumRangesComponent'));
        Vue.component('Tsrangecomponent', () => import('./ts/components/ranges/tsrange/TSRangeComponent'));
        Vue.component('Tsrangescomponent', () => import('./ts/components/ranges/tsranges/TSRangesComponent'));
        Vue.component('Hourrangecomponent', () => import('./ts/components/ranges/hourrange/HourRangeComponent'));
        Vue.component('Hourrangescomponent', () => import('./ts/components/ranges/hourranges/HourRangesComponent'));

        Vue.directive('var-directive', VarDirective.getInstance());
        Vue.directive('vars-directive', VarsDirective.getInstance());

        AppVuexStoreManager.getInstance().registerModule(DocumentStore.getInstance());

        // On applique un zoom auto si param à TRUE
        // if (EnvHandler.zoom_auto) {
        //     let zoom: number = (1 - (window.devicePixelRatio - 1) / window.devicePixelRatio);

        //     if (zoom <= 1) {
        //         document.body.style['zoom'] = zoom.toString();
        //     }
        // }

        this.vueInstance = this.createVueMain();
        this.vueInstance.$mount('#vueDIV');

        await this.postMountHook();

        const app_name: "client" | "admin" | "login" = this.appController.app_name;

        if (EnvHandler.activate_pwa && ((app_name == "client") || (app_name == "login"))) {
            await PWAController.getInstance().initialize_pwa(
                $,
                app_name,
                '/public/client-sw.' + EnvHandler.version + '.js',
            );
        }
        // this.registerPushWorker();

        if (ModuleSuiviCompetences.getInstance().actif) {
            SuiviCompetencesVueController.initialize();
        }

        window.onbeforeunload = (e) => {
            e = e || window.event;

            // ConsoleHandler.log('onbeforeunload');

            let needsSaving = false;

            if (self.vueRouter && self.vueRouter.app && self.vueRouter.app.$children) {
                for (const i in self.vueRouter.app.$children) {
                    const component = self.vueRouter.app.$children[i];
                    if (component && component['needSaving']) {
                        needsSaving = true;
                    }
                }
            }

            if (needsSaving) {
                const message = "Editing is not saved";
                // For IE and Firefox
                if (e) {
                    e.returnValue = message;
                }
                // For Safari
                return message;
            }

            try {

                self.unregisterVarsBeforeUnload();
            } catch (error) {
                ConsoleHandler.error(error);
            }

            return null;
        };
    }

    protected async postInitializationHook() { }
    protected async postMountHook() { }

    protected unregisterVarsBeforeUnload() {
        if (VarsClientController.registered_var_params) {
            const params: VarDataBaseVO[] = [];
            for (const i in VarsClientController.registered_var_params) {
                const wrapper = VarsClientController.registered_var_params[i];
                params.push(wrapper.var_param);
            }
            if (params.length) {
                VarsClientController.getInstance().unRegisterParams(params);
            }
        }
    }

    protected abstract createVueMain(): VueComponentBase;
    protected abstract initializeVueAppModulesDatas(): Promise<any>;
}