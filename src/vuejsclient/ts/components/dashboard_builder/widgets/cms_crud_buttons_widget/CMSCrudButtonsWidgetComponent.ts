import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CMSCrudButtonsWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSCrudButtonsWidgetOptionsVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import CRUDHandler from '../../../../../../shared/tools/CRUDHandler';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../table_widget/crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from '../table_widget/crud_modals/update/CRUDUpdateModalComponent';
import './CMSCrudButtonsWidgetComponent.scss';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import UserRoleVO from '../../../../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import RoleVO from '../../../../../../shared/modules/AccessPolicy/vos/RoleVO';

@Component({
    template: require('./CMSCrudButtonsWidgetComponent.pug'),
    components: {}
})
export default class CMSCrudButtonsWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @ModuleDashboardPageGetter
    private get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    private show_add: boolean = false;
    private show_update: boolean = false;
    private show_delete: boolean = false;
    private show_manual_vo_type: boolean = false;
    private show_add_edit_fk: boolean = true;
    private manual_vo_type: string;

    private show_crud_buttons: boolean = false;

    private vo_type: string = null;

    private has_access_to_add: boolean = false;
    private has_access_to_update: boolean = false;
    private has_access_to_delete: boolean = false;

    private user: UserVO = null;
    private base_url: string = null;

    get widget_options(): CMSCrudButtonsWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSCrudButtonsWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSCrudButtonsWidgetOptionsVO;
                options = options ? new CMSCrudButtonsWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('get_cms_vo')
    private onchange_get_cms_vo() {
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
        this.show_add_edit_fk = this.widget_options.show_add_edit_fk;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.show_add = false;
            this.show_update = false;
            this.show_delete = false;
            this.show_manual_vo_type = false;
            this.manual_vo_type = null;
            this.show_add_edit_fk = true;

            return;
        }

        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
        this.show_add_edit_fk = this.widget_options.show_add_edit_fk;

        if (!this.widget_options.role_access || this.widget_options.role_access.length == 0) {
            this.show_crud_buttons = true;
        }

        this.user = VueAppController.getInstance().data_user;

        if (this.user?.id && this.widget_options.role_access?.length > 0) {

            const user_roles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().user_id, this.user.id).select_vos();
            const role_ids: number[] = user_roles.map((role: UserRoleVO) => role.role_id);
            const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).filter_by_ids(role_ids).select_vos();

            for (const i in roles) {
                if (this.widget_options.role_access.find((role: RoleVO) => role.id == roles[i].id)) {
                    this.show_crud_buttons = true;
                    break;
                }
            }
        }
    }

    private async mounted() {
        this.user = VueAppController.getInstance().data_user;

        if (this.show_manual_vo_type == true) {
            this.vo_type = this.manual_vo_type;
        } else {
            this.vo_type = this.get_cms_vo?._type;
        }

        if (this.vo_type) {
            const promises = [];

            promises.push((async () => {
                this.has_access_to_add = await ModuleAccessPolicy.getInstance().testAccess(
                    DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.vo_type));
            })());

            promises.push((async () => {
                this.has_access_to_update = await ModuleAccessPolicy.getInstance().testAccess(
                    DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.vo_type));
            })());

            promises.push((async () => {
                this.has_access_to_delete = await ModuleAccessPolicy.getInstance().testAccess(
                    DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.vo_type));
            })());
            promises.push((async () => {
                this.base_url = VueAppController.getInstance().base_url;
            })());

            await Promise.all(promises);
        }

        this.onchange_widget_options();
    }

    private update_visible_options() {
        this.$emit('refresh');
    }

    private open_add_modal() {
        if (this.vo_type) {
            this.get_Crudcreatemodalcomponent.open_modal(this.vo_type,
                this.storeDatas,
                this.update_visible_options.bind(this),
                null,
                this.show_add_edit_fk
            );
        }
    }
    // Update et delete uniquement en non manuel
    private open_update_modal() {
        this.get_Crudupdatemodalcomponent.open_modal(
            this.get_cms_vo,
            this.storeDatas,
            this.update_visible_options.bind(this),
            this.show_add_edit_fk
        );
    }
    private async open_delete_modal() {
        if (this.vo_type && this.get_cms_vo.id) {
            const vo = await query(this.vo_type).filter_by_id(this.get_cms_vo.id).select_vo();
            await ModuleDAO.getInstance().deleteVOs([vo]);

            this.$router.push({ name: 'Home' });
        }
    }
}