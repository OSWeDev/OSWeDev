import Vue from 'vue';
import { RouteConfig } from 'vue-router';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ComponentDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import TableWidgetController from '../dashboard_builder/widgets/table_widget/TableWidgetController';
import AccessPolicyVueController from './AccessPolicyVueController';
import ImpersonateComponent from './user/impersonate/ImpersonateComponent';
import SendInitPwdComponent from './user/sendinitpwd/SendInitPwdComponent';
import SendRecaptureComponent from './user/sendrecapture/SendRecaptureComponent';

export default class AccessPolicyVueModule extends VueModuleBase {
    public static getInstance(): AccessPolicyVueModule {
        if (!AccessPolicyVueModule.instance) {
            AccessPolicyVueModule.instance = new AccessPolicyVueModule();
        }

        return AccessPolicyVueModule.instance;
    }

    private static instance: AccessPolicyVueModule = null;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    public initialize() {
        this.routes.push(
            this.getRouteUser()
        );

        Vue.component('Impersonatecomponent', async () => (await import('./user/impersonate/ImpersonateComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'impersonate',
                'Impersonatecomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendinitpwdcomponent', async () => (await import('./user/sendinitpwd/SendInitPwdComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'sendinitpwd',
                'Sendinitpwdcomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendrecapturecomponent', async () => (await import('./user/sendrecapture/SendRecaptureComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'sendrecapture',
                'Sendrecapturecomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
    }

    public async initializeAsync() {
        await CRUDComponentManager.getInstance().registerCRUD(
            UserVO.API_TYPE_ID,
            null,
            null,
            this.routes
        );
        await AccessPolicyVueController.getInstance().conf_precreate_uservo_unicity();
    }

    /**
     * FIXME : duplicates with /me ...
     */
    public getRoutesMenu(): Array<{ route: RouteConfig, icon: string, text: string }> {
        const routes: Array<{ route: RouteConfig, icon: string, text: string }> = [];

        routes.push({
            route: this.getRouteUser(),
            icon: 'fa-user',
            text: 'menu.mon-compte'
        });
        return routes;
    }

    /**
     * FIXME : duplicates with /me ...
     */
    private getRouteUser(): RouteConfig {
        return {
            path: '/user',
            name: 'user',
            component: () => import('./user/UserComponent')
        };
    }
}