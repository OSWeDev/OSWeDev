import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import Throttle from '../../../../../shared/annotations/Throttle';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DBBConfVO from '../../../../../shared/modules/DashboardBuilder/vos/DBBConfVO';
import EventifyEventListenerConfVO from '../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ObjectHandler, { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import { SafeWatch } from '../../../tools/annotations/SafeWatch';
import { TestAccess } from '../../../tools/annotations/TestAccess';
import ModuleTablesClientController from '../../module_tables/ModuleTablesClientController';
import VueComponentBase from '../../VueComponentBase';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';
import './CrudDBLinkComponent.scss';

@Component({
    template: require('./CrudDBLinkComponent.pug'),
    components: {
    }
})
export default class CrudDBLinkComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_CRUD_TYPE)
    public POLICY_DBB_CAN_UPDATE_CRUD_TYPE: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE)
    public POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE)
    public POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ)
    public POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ: boolean = false;
    @TestAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE)
    public POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE: boolean = false;

    public selected_vo_type: string = null;

    public moduletable_crud_template_type: { id: number, label: string } = {
        id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION,
        label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION]),
    };
    public moduletable_crud_template_saisie_mode: { id: number, label: string } = {
        id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE,
        label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE]),
    };

    get type_saisie(): number {
        return DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CREATE_UPDATE;
    }

    get moduletable_crud_template_type_options(): { id: number, label: string }[] {
        return DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS.map((label: string, index: number) => {
            return { id: index, label: this.t(label) };
        });
    }

    get moduletable_crud_template_saisie_mode_options(): { id: number, label: string }[] {
        return DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS.map((label: string, index: number) => {
            return { id: index, label: this.t(label) };
        });
    }

    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<CrudDBLinkComponent>().get_dashboard);
    }

    get get_active_api_type_ids(): string[] {
        return this.vuexGet(reflect<this>().get_active_api_type_ids);
    }

    get get_current_dbb_conf(): DBBConfVO {
        return this.vuexGet(reflect<CrudDBLinkComponent>().get_current_dbb_conf);
    }

    get get_all_valid_db_conf_tables_by_table_name(): { [table_name: string]: ModuleTableVO } {
        return this.vuexGet(reflect<CrudDBLinkComponent>().get_all_valid_db_conf_tables_by_table_name);
    }

    get get_can_update_crud_type(): boolean {
        return this.POLICY_DBB_CAN_UPDATE_CRUD_TYPE && this.get_current_dbb_conf && this.get_current_dbb_conf.has_access_to_templating_options;
    }

    get get_can_update_option_formulaire(): boolean {
        return this.POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE && this.get_current_dbb_conf && this.get_current_dbb_conf.has_access_to_templating_options;
    }

    get get_can_update_is_template_create(): boolean {
        return this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE && this.get_current_dbb_conf && this.get_current_dbb_conf.has_access_to_templating_options && this.get_current_dbb_conf.has_access_to_create_or_update_crud_templating_option;
    }

    get get_can_update_is_template_read(): boolean {
        return this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ && this.get_current_dbb_conf && this.get_current_dbb_conf.has_access_to_templating_options && this.get_current_dbb_conf.has_access_to_create_or_update_crud_templating_option;
    }

    get get_can_update_is_template_update(): boolean {
        return this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE && this.get_current_dbb_conf && this.get_current_dbb_conf.has_access_to_create_or_update_crud_templating_option;
    }

    get vo_type_options(): string[] {

        if (!this.get_all_valid_db_conf_tables_by_table_name) {
            return [];
        }

        return Object.keys(this.get_all_valid_db_conf_tables_by_table_name);
    }

    @SafeWatch(reflect<CrudDBLinkComponent>().get_dashboard, { immediate: true })
    private async onchange_dashboard() {
        if (this.get_dashboard) {

            // Init selected_vo_type
            if (this.get_dashboard.moduletable_crud_template_ref_id && ModuleTableController.module_tables_by_vo_id[this.get_dashboard.moduletable_crud_template_ref_id].vo_type != this.selected_vo_type) {
                this.selected_vo_type = ModuleTableController.module_tables_by_vo_id[this.get_dashboard.moduletable_crud_template_ref_id].vo_type;
            } else if ((!this.get_dashboard.moduletable_crud_template_ref_id) && (!!this.selected_vo_type)) {
                this.selected_vo_type = null;
            }

            if (this.get_dashboard.moduletable_crud_template_type != this.moduletable_crud_template_type?.id) {
                this.moduletable_crud_template_type = { id: this.get_dashboard.moduletable_crud_template_type, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS[this.get_dashboard.moduletable_crud_template_type]) };
            }

            if (this.get_dashboard.moduletable_crud_template_saisie_mode != this.moduletable_crud_template_saisie_mode?.id) {
                this.moduletable_crud_template_saisie_mode = { id: this.get_dashboard.moduletable_crud_template_saisie_mode, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS[this.get_dashboard.moduletable_crud_template_saisie_mode]) };
            }

        } else {

            if (!!this.selected_vo_type) {
                this.selected_vo_type = null;
            }

            this.moduletable_crud_template_type = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION]) };
            this.moduletable_crud_template_saisie_mode = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE]) };
        }
    }

    @SafeWatch(reflect<CrudDBLinkComponent>().moduletable_crud_template_type)
    private async onchange_moduletable_crud_template_type() {
        await this.push_confs_to_db();
    }

    @SafeWatch(reflect<CrudDBLinkComponent>().moduletable_crud_template_saisie_mode)
    private async onchange_moduletable_crud_template_saisie_mode() {
        await this.push_confs_to_db();
    }

    @SafeWatch(reflect<CrudDBLinkComponent>().selected_vo_type)
    private async onchange_selected_vo_type() {
        if (!!this.selected_vo_type) {
            // Si la table est déjà liée au DB, osef, sinon on doit l'ajouter
            if (this.get_active_api_type_ids.indexOf(this.selected_vo_type) >= 0) {
                // La table est déjà liée, on ne fait rien
            } else {
                // On ajoute la table au DB en l'ajoutant au graph
                await ModuleTablesClientController.add_new_default_table(this.get_dashboard.id, this.selected_vo_type);
            }
        } else {
            if (!!this.selected_vo_type) {
                this.selected_vo_type = null;
            }

            this.moduletable_crud_template_type = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION]) };
            this.moduletable_crud_template_saisie_mode = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE]) };
        }
        this.push_confs_to_db();
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
        leading: true,
    })
    private async push_confs_to_db() {

        await this.update_dashboard_vo();
    }

    public async created() {
        await all_promises([
            (async () => {
                this.POLICY_DBB_CAN_UPDATE_CRUD_TYPE = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_CRUD_TYPE);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ);
            })(),
            (async () => {
                this.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE = await ModuleAccessPolicy.getInstance().testAccess(ModuleDashboardBuilder.POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE);
            })(),
        ]);
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    private vo_type_label(vo_type: string): string {
        const mt: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[vo_type];
        if (!mt) {
            return vo_type;
        }
        return this.t(mt.label.code_text);
    }

    private async update_dashboard_vo() {
        if (!this.get_dashboard) {
            return;
        }

        const diffs = {};
        if (this.get_dashboard.moduletable_crud_template_ref_id != ModuleTableController.module_tables_by_vo_type[this.selected_vo_type]?.id) {
            this.get_dashboard.moduletable_crud_template_ref_id = ModuleTableController.module_tables_by_vo_type[this.selected_vo_type]?.id || null;
            diffs[field_names<DashboardVO>().moduletable_crud_template_ref_id] = this.get_dashboard.moduletable_crud_template_ref_id;
        }

        if (this.moduletable_crud_template_type?.id == null) {
            this.moduletable_crud_template_type = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_CONSULTATION]) };
        }

        if (this.get_dashboard.moduletable_crud_template_type != this.moduletable_crud_template_type.id) {
            this.get_dashboard.moduletable_crud_template_type = this.moduletable_crud_template_type.id;
            diffs[field_names<DashboardVO>().moduletable_crud_template_type] = this.get_dashboard.moduletable_crud_template_type;
        }

        if (this.moduletable_crud_template_saisie_mode?.id == null) {
            this.moduletable_crud_template_saisie_mode = { id: DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE, label: this.t(DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_LABELS[DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_SAISIE_MODE_CREATE_UPDATE]) };
        }

        if (this.get_dashboard.moduletable_crud_template_saisie_mode != this.moduletable_crud_template_saisie_mode.id) {
            this.get_dashboard.moduletable_crud_template_saisie_mode = this.moduletable_crud_template_saisie_mode.id;
            diffs[field_names<DashboardVO>().moduletable_crud_template_saisie_mode] = this.get_dashboard.moduletable_crud_template_saisie_mode;
        }

        if (ObjectHandler.hasAtLeastOneAttribute(diffs)) {
            await query(DashboardVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_id(this.get_dashboard.id)
                .update_vos<DashboardVO>(diffs);
        }
    }
}