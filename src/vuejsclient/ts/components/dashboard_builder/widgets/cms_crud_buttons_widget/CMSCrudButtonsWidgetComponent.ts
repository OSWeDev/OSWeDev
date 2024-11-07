import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
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

    private show_add: boolean = true;
    private show_update: boolean = true;
    private show_delete: boolean = true;

    private has_access_to_add: boolean = false;
    private has_access_to_update: boolean = false;
    private has_access_to_delete: boolean = false;

    private user: UserVO = null;

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

    get cms_vo_api_type_id(): string {
        return this.get_cms_vo?._type;
    }

    get cms_vo_id(): number {
        return this.get_cms_vo?.id;
    }

    @Watch('get_cms_vo')
    private onchange_get_cms_vo() {
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.show_add = true;
            this.show_update = true;
            this.show_delete = true;

            return;
        }

        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
    }

    private async mounted() {
        this.user = VueAppController.getInstance().data_user;

        this.has_access_to_add = await ModuleAccessPolicy.getInstance().testAccess(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.cms_vo_api_type_id));
        this.has_access_to_update = await ModuleAccessPolicy.getInstance().testAccess(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_INSERT_OR_UPDATE, this.cms_vo_api_type_id));
        this.has_access_to_delete = await ModuleAccessPolicy.getInstance().testAccess(
            DAOController.getAccessPolicyName(ModuleDAO.DAO_ACCESS_TYPE_DELETE, this.cms_vo_api_type_id));

        this.onchange_widget_options();
    }

    private update_visible_options() {
        this.$emit('refresh');
    }

    private open_add_modal() {
        (this.$refs['Crudcreatemodalcomponent'] as CRUDCreateModalComponent).open_modal(this.cms_vo_api_type_id, this.update_visible_options.bind(this));
    }
    private open_update_modal() {
        (this.$refs['Crudupdatemodalcomponent'] as CRUDUpdateModalComponent).open_modal(this.get_cms_vo, this.update_visible_options.bind(this));
    }
    private open_delete_modal() {
        CRUDHandler.getDeleteLink(this.cms_vo_api_type_id, this.cms_vo_id);
    }
}