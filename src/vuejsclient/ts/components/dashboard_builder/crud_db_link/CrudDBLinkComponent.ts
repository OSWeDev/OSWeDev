import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../shared/annotations/Throttle';
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
import VueComponentBase from '../../VueComponentBase';
import './CrudDBLinkComponent.scss';

@Component({
    template: require('./CrudDBLinkComponent.pug'),
    components: {
    }
})
export default class CrudDBLinkComponent extends VueComponentBase {
    @Prop({ default: null })
    public readonly dashboard: DashboardVO;

    public selected_vo_type: string = null;

    public vo_type_options: string[] = [];

    public option_formulaire: boolean = false;
    public option_template_create: boolean = false;
    public option_template_read: boolean = false;
    public option_template_update: boolean = false;

    @Watch(reflect<CrudDBLinkComponent>().dashboard, { immediate: true })
    private onchange_dashboard() {
        if (this.dashboard) {

            if (this.dashboard.moduletable_crud_template_ref_id && ModuleTableController.module_tables_by_vo_id[this.dashboard.moduletable_crud_template_ref_id].vo_type != this.selected_vo_type) {
                this.selected_vo_type = ModuleTableController.module_tables_by_vo_id[this.dashboard.moduletable_crud_template_ref_id].vo_type;
                return;
            }

            if ((!this.dashboard.moduletable_crud_template_ref_id) && (!!this.selected_vo_type)) {
                this.selected_vo_type = null;
                return;
            }
        }

        if (!!this.selected_vo_type) {
            this.selected_vo_type = null;
        }
    }

    @Watch(reflect<CrudDBLinkComponent>().selected_vo_type)
    private onchange_selected_vo_type() {
        if (!!this.selected_vo_type) {
            this.$emit("addTable", this.selected_vo_type);
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
        this.vo_type_options = await ModuleDashboardBuilder.getInstance().get_all_valid_api_type_ids();
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

            if (this.option_template_read) {
                this.option_template_read = false;
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
        if (!this.dashboard) {
            return;
        }

        const diffs = {};
        if (this.dashboard.moduletable_crud_template_ref_id != ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id) {
            this.dashboard.moduletable_crud_template_ref_id = ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id;
            diffs[field_names<DashboardVO>().moduletable_crud_template_ref_id] = this.dashboard.moduletable_crud_template_ref_id;
        }

        if (this.dashboard.moduletable_crud_template_form != this.option_formulaire) {
            this.dashboard.moduletable_crud_template_form = this.option_formulaire;
            diffs[field_names<DashboardVO>().moduletable_crud_template_form] = this.dashboard.moduletable_crud_template_form;
        }

        if (ObjectHandler.hasAtLeastOneAttribute(diffs)) {
            await query(DashboardVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_id(this.dashboard.id)
                .update_vos<DashboardVO>(diffs);
        }
    }

    private async update_crud_db_link_vo() {
        if (!this.dashboard) {
            return;
        }


        if ((!this.dashboard.moduletable_crud_template_ref_id) || (!this.option_formulaire) || (!this.option_template_create && !this.option_template_read && !this.option_template_update)) {

            // Si on a une conf de crud db link, et qu'elle fait référence à ce db, on doit retirer le lien
            const template_create_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_create_db_ref_id, this.dashboard.id)
                .select_vo<CRUDDBLinkVO>();
            if (template_create_db_ref_id_crud_db_link_vo) {
                template_create_db_ref_id_crud_db_link_vo.template_create_db_ref_id = null;
                await ModuleDAO.getInstance().insertOrUpdateVO(template_create_db_ref_id_crud_db_link_vo);
            }

            const template_read_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_read_db_ref_id, this.dashboard.id)
                .select_vo<CRUDDBLinkVO>();
            if (template_read_db_ref_id_crud_db_link_vo) {
                template_read_db_ref_id_crud_db_link_vo.template_read_db_ref_id = null;
                await ModuleDAO.getInstance().insertOrUpdateVO(template_read_db_ref_id_crud_db_link_vo);
            }


            const template_update_db_ref_id_crud_db_link_vo: CRUDDBLinkVO = await query(CRUDDBLinkVO.API_TYPE_ID)
                .exec_as_server()
                .filter_by_num_eq(field_names<CRUDDBLinkVO>().template_update_db_ref_id, this.dashboard.id)
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
            .filter_by_id(this.dashboard.moduletable_crud_template_ref_id)
            .select_vo<CRUDDBLinkVO>();

        if ((!crud_db_link_vo) && (this.option_formulaire && (this.option_template_create || this.option_template_read || this.option_template_update))) {
            crud_db_link_vo = new CRUDDBLinkVO();
            crud_db_link_vo.moduletable_ref_id = ModuleTableController.module_tables_by_vo_type[this.selected_vo_type].id;
            crud_db_link_vo.template_create_db_ref_id = this.option_template_create ? this.dashboard.id : null;
            crud_db_link_vo.template_read_db_ref_id = this.option_template_read ? this.dashboard.id : null;
            crud_db_link_vo.template_update_db_ref_id = this.option_template_update ? this.dashboard.id : null;

            await ModuleDAO.getInstance().insertOrUpdateVO(crud_db_link_vo);
            return;
        }

        if (crud_db_link_vo) {
            // On a une conf, on met à jour au besoin
            let need_update = false;
            if (this.option_template_create && (crud_db_link_vo.template_create_db_ref_id != this.dashboard.id)) {
                crud_db_link_vo.template_create_db_ref_id = this.dashboard.id;
                need_update = true;
            } else if (!this.option_template_create && (crud_db_link_vo.template_create_db_ref_id == this.dashboard.id)) {
                crud_db_link_vo.template_create_db_ref_id = null;
                need_update = true;
            }
            if (this.option_template_read && (crud_db_link_vo.template_read_db_ref_id != this.dashboard.id)) {
                crud_db_link_vo.template_read_db_ref_id = this.dashboard.id;
                need_update = true;
            } else if (!this.option_template_read && (crud_db_link_vo.template_read_db_ref_id == this.dashboard.id)) {
                crud_db_link_vo.template_read_db_ref_id = null;
                need_update = true;
            }
            if (this.option_template_update && (crud_db_link_vo.template_update_db_ref_id != this.dashboard.id)) {
                crud_db_link_vo.template_update_db_ref_id = this.dashboard.id;
                need_update = true;
            } else if (!this.option_template_update && (crud_db_link_vo.template_update_db_ref_id == this.dashboard.id)) {
                crud_db_link_vo.template_update_db_ref_id = null;
                need_update = true;
            }

            if (need_update) {
                await ModuleDAO.getInstance().insertOrUpdateVO(crud_db_link_vo);
            }
        }
    }
}