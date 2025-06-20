import VueFlags from "@growthbunker/vueflags";
import 'bootstrap';

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import 'jquery-ui-dist/jquery-ui.css';

import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import 'moment/locale/es';
import "moment/locale/fr";
import 'moment/locale/it';

import VueQuarterSelect from '@3scarecrow/vue-quarter-select';
import { ColorPanel, ColorPicker } from 'one-colorpicker';
import 'select2';
import VCalendar from 'v-calendar';
import VTooltip from 'v-tooltip';
import Vue from 'vue';
import VueCookies from 'vue-cookies-ts';
import VueDraggableResizable from 'vue-draggable-resizable';
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
import ModuleAccessPolicy from "../shared/modules/AccessPolicy/ModuleAccessPolicy";
import { query } from "../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldController from "../shared/modules/DAO/ModuleTableFieldController";
import ModuleTableFieldVO from "../shared/modules/DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../shared/modules/DAO/vos/ModuleTableVO";
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
import VueAppBaseInstanceHolder from "./VueAppBaseInstanceHolder";
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
import ModalsAndBasicPageComponentsHolderStore from "./ts/components/modals_and_basic_page_components_holder/ModalsAndBasicPageComponentsHolderStore";
import MultipleSelectFilterComponent from './ts/components/multiple_select_filter/MultipleSelectFilterComponent';
import UserNotifsMarkerComponent from './ts/components/notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import SupervisionDashboardStore from "./ts/components/supervision/dashboard/SupervisionDashboardStore";
import SurveyStore from "./ts/components/survey/store/SurveyStore";
import IVueModule from './ts/modules/IVueModule';
import PushDataVueModule from './ts/modules/PushData/PushDataVueModule';
import StatsVueModule from "./ts/modules/Stats/StatsVueModule";
import VueModuleBase from './ts/modules/VueModuleBase';
import AppVuexStoreManager from './ts/store/AppVuexStoreManager';
import DataSynchroController from "./ts/modules/PushData/DataSynchroController";
import TranslatableFieldController from "../shared/modules/DAO/TranslatableFieldController";
import AjaxCacheClientController from "./ts/modules/AjaxCache/AjaxCacheClientController";

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

    public vueInstance: VueComponentBase & Vue;
    public vueRouter: VueRouter;

    public routes_aliases: RouteAli

    protected constructor(
        public appController: VueAppController,
        private initializeModulesDatas: () => Promise<unknown>,
    ) {
        VueAppBaseInstanceHolder.instance = this;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): VueAppBase {
        return VueAppBaseInstanceHolder.instance as VueAppBase;
    }

    public async runApp() {

        TranslatableFieldController.thread_name = AjaxCacheClientController.getInstance().client_tab_id;

        $(document).on('click', function () {
            $('.ui-tooltip').remove();
        });

        ConsoleHandler.init('client');
        ModulesManager.initialize();

        // Chargement des données des modules.
        await this.initializeModulesDatas();

        DatatableField.VueAppBase = this;

        const self = this;
        let promises = [];

        Vue.config.devtools = false;
        if (EnvHandler.is_dev) {
            Vue.config.devtools = true;
        }

        promises.push(
            this.appController.initialize(),
            this.load_all_module_table_ids(),
            this.load_all_module_table_field_ids(),
        );

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

        const modules_by_name = ModulesManager.modules_by_name;

        // On commence par demander tous les droits d'accès des modules
        promises = [];
        for (const module_name in modules_by_name) {
            const module_: VueModuleBase = ModulesManager.getModuleByNameAndRole(
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
            const module_: VueModuleBase = ModulesManager.getModuleByNameAndRole(
                module_name,
                VueModuleBase.IVueModuleRoleName,
            ) as VueModuleBase;

            if (module_) {
                await module_.initializeAsync(this);
            }
        }

        await this.postInitializationHook();

        // var baseApiUrl = this.appController.data_base_api_url || '';

        ConsoleLogLogger.getInstance().prepare_console_logger();

        const default_locale = LocaleManager.getDefaultLocale();
        // let uiDebug = this.appController.data_ui_debug == "1" || window.location.search.indexOf('ui-debug=1') != -1;
        moment.locale(default_locale);

        // Vue.config.errorHandler = function (err, vm, info) {
        //     if (err.message.includes("Failed to fetch dynamically imported module")) {
        //         ConsoleHandler.error(err + " - " + info + " - Reloading page");
        //         window.location.reload();
        //     }
        // };

        /**
         * On ajoute aussi un handler si on a un import qui ne marche pas, ya eu recompilation probablement donc on reload
         */
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            const errorMessage = event.reason?.message || '';

            if (errorMessage.includes('Failed to fetch dynamically imported module')) {
                const lastReload = localStorage.getItem('lastReloadTimestamp');
                const now = Date.now();

                if (!lastReload || now - parseInt(lastReload, 10) > 60_000) {
                    localStorage.setItem('lastReloadTimestamp', now.toString());
                    window.location.reload();
                } else {
                    console.warn('Rechargement récent détecté, pas de reload supplémentaire.');
                }
            }
        });

        Vue.use(ColorPanel);
        Vue.use(ColorPicker);

        Vue.use(ClientTable);
        Vue.use(VueCookies);

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
        const moduleWrappersByName: { [key: string]: ModuleWrapper } = ModulesManager.getModuleWrappersByName();

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

        /**
         * On change la logique de route par défaut pour gérer les aliases d'url.
         */
        // routerOptions.routes.push({
        //     path: '*',
        //     name: '404',
        //     component: () => import('./ts/components/Error404/component/Error404Component'),
        // });

        // On ajoute les alias de routes : Attention à la mise à jour en temps réel, on lance donc une synchro et un watcher, qui doivent tourner en permanence pour assurer que les routes restent toujours completes
        await DataSynchroController.register_vo_updates_on_list(
            this,
            ALias
        )
        TODO synchro des alias

        routerOptions.routes.map(route => ({
            ...route,
            beforeEnter: async (to, from, next) => {
                const response = await axios.get(`/api/alias/resolve?realPath=${encodeURIComponent(to.path)}`);
                if (response.data && response.data.alias) {
                    next({ path: '/' + response.data.alias, replace: true });
                } else {
                    next();
                }
            },
        })),
        {
            path: '/:alias',
            component: {
                async created() {
                    const alias = this.$route.params.alias;
                    const response = await axios.get(`/api/alias/${encodeURIComponent(alias)}`);
                    if (response.data && response.data.realPath) {
                        this.$router.replace(response.data.realPath);
                    } else {
                        this.$router.replace('/404');
                    }
                },
                render() { return null; },
            },
        },
];
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

        this.vueRouter.beforeEach(async (route, redirect, next) => {
            if (!navigator.onLine) {
                const same_version_app: boolean = await PushDataVueModule.getInstance().wait_navigator_online();

                if (!same_version_app) {
                    return;
                }
            }

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

            while (VueAppController.getInstance().routes_log.length >= VueAppController.getInstance().routes_log_limit) {
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
            iconPath: '/public/client/img/flags/',
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
        AppVuexStoreManager.getInstance().registerModule(ModalsAndBasicPageComponentsHolderStore.getInstance());
        AppVuexStoreManager.getInstance().registerModule(SupervisionDashboardStore.getInstance());
        AppVuexStoreManager.getInstance().registerModule(SurveyStore.getInstance());

        // On applique un zoom auto si param à TRUE
        // if (EnvHandler.zoom_auto) {
        //     let zoom: number = (1 - (window.devicePixelRatio - 1) / window.devicePixelRatio);

        //     if (zoom <= 1) {
        //         document.body.style['zoom'] = zoom.toString();
        //     }
        // }

        this.vueInstance = this.createVueMain();
        this.vueInstance.$mount('#vueDIV');
        LocaleManager.set_vue_instance_ref(this.vueInstance);

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

    private async load_all_module_table_ids() {
        const moduletables = await query(ModuleTableVO.API_TYPE_ID)
            .select_vos<ModuleTableVO>();

        for (const i in moduletables) {
            const moduletable = moduletables[i];
            // On ne récupère que l'id pour le moment

            if (!ModuleTableController.module_tables_by_vo_type[moduletable.vo_type]) {
                ModuleTableController.module_tables_by_vo_type[moduletable.vo_type] = moduletable;
            } else {
                ModuleTableController.module_tables_by_vo_type[moduletable.vo_type].id = moduletable.id;
            }

            ModuleTableController.module_tables_by_vo_id[moduletable.id] = ModuleTableController.module_tables_by_vo_type[moduletable.vo_type];
        }
    }

    private async load_all_module_table_field_ids() {
        const moduletablefields = await query(ModuleTableFieldVO.API_TYPE_ID)
            .select_vos<ModuleTableFieldVO>();

        for (const i in moduletablefields) {
            const moduletablefield = moduletablefields[i];
            // On ne récupère que l'id pour le moment
            if (!ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type]) {
                ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type] = {};
            }
            if (ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type][moduletablefield.field_name]) {
                ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type][moduletablefield.field_name].id = moduletablefield.id;
            } else {
                ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type][moduletablefield.field_name] = moduletablefield;
            }

            if (!ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[moduletablefield.module_table_id]) {
                ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[moduletablefield.module_table_id] = {};
            }
            ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[moduletablefield.module_table_id][moduletablefield.id] = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduletablefield.module_table_vo_type][moduletablefield.field_name];
        }
    }


    protected abstract createVueMain(): VueComponentBase;
    protected abstract initializeVueAppModulesDatas(): Promise<any>;

}