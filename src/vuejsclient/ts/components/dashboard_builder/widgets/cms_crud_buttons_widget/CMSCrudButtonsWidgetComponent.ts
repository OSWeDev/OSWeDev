import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRoleVO from '../../../../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DAOController from '../../../../../../shared/modules/DAO/DAOController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CMSCrudButtonsWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSCrudButtonsWidgetOptionsVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueAppController from '../../../../../VueAppController';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import { ModuleModalsAndBasicPageComponentsHolderGetter } from '../../../modals_and_basic_page_components_holder/ModalsAndBasicPageComponentsHolderStore';
import VueComponentBase from '../../../VueComponentBase';
import CRUDCreateModalComponent from '../table_widget/crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from '../table_widget/crud_modals/update/CRUDUpdateModalComponent';
import './CMSCrudButtonsWidgetComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./CMSCrudButtonsWidgetComponent.pug'),
    components: {}
})
export default class CMSCrudButtonsWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    public all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public dashboard_page: DashboardPageVO;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    public show_add: boolean = false;
    public show_update: boolean = false;
    public show_delete: boolean = false;
    public show_manual_vo_type: boolean = false;
    public show_add_edit_fk: boolean = true;
    public manual_vo_type: string;

    public show_crud_buttons: boolean = false;

    public vo_type: string = null;

    public has_access_to_add: boolean = false;
    public has_access_to_update: boolean = false;
    public has_access_to_delete: boolean = false;

    public user: UserVO = null;
    public base_url: string = null;

    get get_crud_vo(): IDistantVOBase {
        return this.vuexGet(reflect<this>().get_crud_vo);
    }

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

    @Watch('get_crud_vo')
    public onchange_get_crud_vo() {
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
        this.show_add_edit_fk = this.widget_options.show_add_edit_fk;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
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

    public async mounted() {
        this.user = VueAppController.getInstance().data_user;

        if (this.show_manual_vo_type == true) {
            this.vo_type = this.manual_vo_type;
        } else {
            this.vo_type = this.get_crud_vo?._type;
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

    public update_visible_options() {
        this.$emit('refresh');
    }

    public open_add_modal() {
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
    public open_update_modal() {
        this.get_Crudupdatemodalcomponent.open_modal(
            this.get_crud_vo,
            this.storeDatas,
            this.update_visible_options.bind(this),
            this.show_add_edit_fk
        );
    }
    public async open_delete_modal() {
        if (this.vo_type && this.get_crud_vo.id) {
            const vo = await query(this.vo_type).filter_by_id(this.get_crud_vo.id).select_vo();
            await ModuleDAO.getInstance().deleteVOs([vo]);

            this.$router.push({ name: 'Home' });
        }
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
}