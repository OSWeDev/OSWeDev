import Component from 'vue-class-component';
import { Inject, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../shared/annotations/Throttle';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableVO from '../../../../../shared/modules/DAO/vos/ModuleTableVO';
import ModuleDashboardBuilder from '../../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import CRUDDBLinkVO from '../../../../../shared/modules/DashboardBuilder/vos/crud/CRUDDBLinkVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import EventifyEventListenerConfVO from '../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ObjectHandler, { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ModuleTablesClientController from '../../module_tables/ModuleTablesClientController';
import VueComponentBase from '../../VueComponentBase';
import './CrudDBLinkComponent.scss';

@Component({
    template: require('./CrudDBLinkComponent.pug'),
    components: {
    }
})
export default class CrudDBLinkComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    public selected_vo_type: string = null;

    public vo_type_options: string[] = [];

    public option_formulaire: boolean = false;
    public option_template_create: boolean = false;
    public option_template_read: boolean = false;
    public option_template_update: boolean = false;

    private POLICY_DBB_CAN_UPDATE_CRUD_TYPE: boolean = false;
    private POLICY_DBB_CAN_UPDATE_OPTION_FORMULAIRE: boolean = false;
    private POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_CREATE: boolean = false;
    private POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_READ: boolean = false;
    private POLICY_DBB_CAN_UPDATE_IS_TEMPLATE_UPDATE: boolean = false;

    get get_dashboard(): DashboardVO {
        return this.vuexGet<DashboardVO>(reflect<CrudDBLinkComponent>().get_dashboard);
    }

    get get_active_api_type_ids(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_active_api_type_ids);
    }

    @Watch(reflect<CrudDBLinkComponent>().get_dashboard, { immediate: true })
    private async onchange_dashboard() {
        if (this.get_dashboard) {

            // Init selected_vo_type
            if (this.get_dashboard.moduletable_crud_template_ref_id && ModuleTableController.module_tables_by_vo_id[this.get_dashboard.moduletable_crud_template_ref_id].vo_type != this.selected_vo_type) {
                this.selected_vo_type = ModuleTableController.module_tables_by_vo_id[this.get_dashboard.moduletable_crud_template_ref_id].vo_type;
            } else if ((!this.get_dashboard.moduletable_crud_template_ref_id) && (!!this.selected_vo_type)) {
                this.selected_vo_type = null;
            }

            // Init option_formulaire
            if (this.get_dashboard.moduletable_crud_template_form != this.option_formulaire) {
                this.option_formulaire = this.get_dashboard.moduletable_crud_template_form;
            }

            // Init option_template_xxx
            let target_option_template_create: boolean = false;
            let target_option_template_read: boolean = false;
            let target_option_template_update: boolean = false;
            if (this.get_dashboard.moduletable_crud_template_ref_id) {
                const crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                    .filter_by_id(this.get_dashboard.moduletable_crud_template_ref_id, ModuleTableVO.API_TYPE_ID)
                    .select_vo<CRUDDBLinkVO>();

                if (crud_db_link_vo) {
                    target_option_template_create = crud_db_link_vo.template_create_db_ref_id == this.get_dashboard.id;
                    target_option_template_read = crud_db_link_vo.template_read_db_ref_id == this.get_dashboard.id;
                    target_option_template_update = crud_db_link_vo.template_update_db_ref_id == this.get_dashboard.id;
                }
            }

            if (target_option_template_create != this.option_template_create) {
                this.option_template_create = target_option_template_create;
            }
            if (target_option_template_read != this.option_template_read) {
                this.option_template_read = target_option_template_read;
            }
            if (target_option_template_update != this.option_template_update) {
                this.option_template_update = target_option_template_update;
            }
        } else {

            if (!!this.selected_vo_type) {
                this.selected_vo_type = null;
            }

            if (this.option_formulaire) {
                this.option_formulaire = false;
            }
            if (this.option_template_create) {
                this.option_template_create = false;
            }
            if (this.option_template_read) {
                this.option_template_read = false;
            }
            if (this.option_template_update) {
                this.option_template_update = false;
            }
        }
    }

    @Watch(reflect<CrudDBLinkComponent>().selected_vo_type)
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
            if (!!this.option_formulaire) {
                this.option_formulaire = false;
            }
            if (!!this.option_template_create) {
                this.option_template_create = false;
            }
            if (!!this.option_template_read) {
                this.option_template_read = false;
            }
            if (!!this.option_template_update) {
                this.option_template_update = false;
            }
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
        await this.update_crud_db_link_vo();
    }

    public async created() {
        await all_promises([
            (async () => {
                this.vo_type_options = await ModuleDashboardBuilder.getInstance().get_all_valid_api_type_ids();
            })(),
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
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    private vo_type_label(vo_type: string): string {
        const mt: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[vo_type];
        if (!mt) {
            return vo_type;
        }
        return this.t(mt.label.code_text);
    }

    private switch_option_formulaire() {
        this.option_formulaire = !this.option_formulaire;

        if (!this.option_formulaire) {

            if (this.option_template_create) {
                this.option_template_create = false;
            }

            if (this.option_template_update) {
                this.option_template_update = false;
            }
        }

        this.push_confs_to_db();
    }

    private switch_option_template_create() {
        this.option_template_create = !this.option_template_create;
        this.push_confs_to_db();
    }

    private switch_option_template_read() {
        this.option_template_read = !this.option_template_read;
        this.push_confs_to_db();
    }

    private switch_option_template_update() {
        this.option_template_update = !this.option_template_update;
        this.push_confs_to_db();
    }

    private async update_dashboard_vo() {
        if (!this.get_dashboard) {
            return;
        }

        const diffs = {};
        if (this.get_dashboard.moduletable_crud_template_ref_id != ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id) {
            this.get_dashboard.moduletable_crud_template_ref_id = ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id;
            diffs[field_names<DashboardVO>().moduletable_crud_template_ref_id] = this.get_dashboard.moduletable_crud_template_ref_id;
        }

        if (this.get_dashboard.moduletable_crud_template_form != this.option_formulaire) {
            this.get_dashboard.moduletable_crud_template_form = this.option_formulaire;
            diffs[field_names<DashboardVO>().moduletable_crud_template_form] = this.get_dashboard.moduletable_crud_template_form;
        }

        if (ObjectHandler.hasAtLeastOneAttribute(diffs)) {
            await query(DashboardVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_id(this.get_dashboard.id)
                .update_vos<DashboardVO>(diffs);
        }
    }

    private async update_crud_db_link_vo() {
        if (!this.get_dashboard) {
            return;
        }


        if ((!this.get_dashboard.moduletable_crud_template_ref_id) || (!this.option_template_create && !this.option_template_read && !this.option_template_update)) {

            // Si on a une conf de crud db link, et qu'elle fait référence à ce db, on doit retirer le lien
            const template_create_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_create_db_ref_id, this.get_dashboard.id)
                .select_vo<CRUDDBLinkVO>();
            if (template_create_db_ref_id_crud_db_link_vo) {
                template_create_db_ref_id_crud_db_link_vo.template_create_db_ref_id = null;
                await ModuleDAO.getInstance().insertOrUpdateVO(template_create_db_ref_id_crud_db_link_vo);
            }

            const template_read_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_read_db_ref_id, this.get_dashboard.id)
                .select_vo<CRUDDBLinkVO>();
            if (template_read_db_ref_id_crud_db_link_vo) {
                template_read_db_ref_id_crud_db_link_vo.template_read_db_ref_id = null;
                await ModuleDAO.getInstance().insertOrUpdateVO(template_read_db_ref_id_crud_db_link_vo);
            }


            const template_update_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_update_db_ref_id, this.get_dashboard.id)
                .select_vo<CRUDDBLinkVO>();
            if (template_update_db_ref_id_crud_db_link_vo) {
                template_update_db_ref_id_crud_db_link_vo.template_update_db_ref_id = null;
                await ModuleDAO.getInstance().insertOrUpdateVO(template_update_db_ref_id_crud_db_link_vo);
            }

            return;
        }

        // Pour chacun, si on trouve la ref, on met à jour au besoin, sinon on crée
        let crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
            .exec_as_server()
            .filter_by_id(this.get_dashboard.moduletable_crud_template_ref_id)
            .select_vo<CRUDDBLinkVO>();

        if ((!crud_db_link_vo) && ((this.option_formulaire && (this.option_template_create || this.option_template_update)) || this.option_template_read)) {
            crud_db_link_vo = new CRUDDBLinkVO();
            crud_db_link_vo.moduletable_ref_id = ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id;
            crud_db_link_vo.template_create_db_ref_id = this.option_template_create ? this.get_dashboard.id : null;
            crud_db_link_vo.template_read_db_ref_id = this.option_template_read ? this.get_dashboard.id : null;
            crud_db_link_vo.template_update_db_ref_id = this.option_template_update ? this.get_dashboard.id : null;

            await ModuleDAO.getInstance().insertOrUpdateVO(crud_db_link_vo);
            return;
        }

        if (crud_db_link_vo) {
            // On a une conf, on met à jour au besoin
            let need_update = false;
            if (this.option_template_create && (crud_db_link_vo.template_create_db_ref_id != this.get_dashboard.id)) {
                crud_db_link_vo.template_create_db_ref_id = this.get_dashboard.id;
                need_update = true;
            } else if (!this.option_template_create && (crud_db_link_vo.template_create_db_ref_id == this.get_dashboard.id)) {
                crud_db_link_vo.template_create_db_ref_id = null;
                need_update = true;
            }
            if (this.option_template_read && (crud_db_link_vo.template_read_db_ref_id != this.get_dashboard.id)) {
                crud_db_link_vo.template_read_db_ref_id = this.get_dashboard.id;
                need_update = true;
            } else if (!this.option_template_read && (crud_db_link_vo.template_read_db_ref_id == this.get_dashboard.id)) {
                crud_db_link_vo.template_read_db_ref_id = null;
                need_update = true;
            }
            if (this.option_template_update && (crud_db_link_vo.template_update_db_ref_id != this.get_dashboard.id)) {
                crud_db_link_vo.template_update_db_ref_id = this.get_dashboard.id;
                need_update = true;
            } else if (!this.option_template_update && (crud_db_link_vo.template_update_db_ref_id == this.get_dashboard.id)) {
                crud_db_link_vo.template_update_db_ref_id = null;
                need_update = true;
            }

            if (need_update) {
                await ModuleDAO.getInstance().insertOrUpdateVO(crud_db_link_vo);
            }
        }
    }
}