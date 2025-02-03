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
    private manual_vo_type: string;

    private vo_type: string = null;

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

    @Watch('get_cms_vo')
    private onchange_get_cms_vo() {
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.show_add = false;
            this.show_update = false;
            this.show_delete = false;
            this.show_manual_vo_type = false;
            this.manual_vo_type = null;

            return;
        }

        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
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
                this.update_visible_options.bind(this)
            );
        }
    }
    // Update et delete uniquement en non manuel
    private open_update_modal() {
        this.get_Crudupdatemodalcomponent.open_modal(
            this.get_cms_vo,
            this.storeDatas,
            this.update_visible_options.bind(this)
        );
    }
    private open_delete_modal() {
        if (this.vo_type && this.get_cms_vo.id) {
            CRUDHandler.getDeleteLink(this.vo_type, this.get_cms_vo.id);
        }
    }
}