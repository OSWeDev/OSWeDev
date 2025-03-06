import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSCrudButtonsWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSCrudButtonsWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './CMSCrudButtonsWidgetOptionsComponent.scss';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./CMSCrudButtonsWidgetOptionsComponent.pug')
})
export default class CMSCrudButtonsWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private show_add: boolean = false;
    private show_update: boolean = false;
    private show_delete: boolean = false;
    private show_manual_vo_type: boolean = false;
    private manual_vo_type: string = null;
    private show_add_edit_fk: boolean = true;
    private selected_roles: RoleVO[] = [];
    private list_roles: RoleVO[] = [];

    private next_update_options: CMSCrudButtonsWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });


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

    get manual_vo_type_select_options(): string[] {
        return this.get_dashboard_api_type_ids;
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
            this.selected_roles = [];

            return;
        }
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
        this.show_manual_vo_type = this.widget_options.show_manual_vo_type;
        this.manual_vo_type = this.widget_options.manual_vo_type;
        this.show_add_edit_fk = this.widget_options.show_add_edit_fk;
        this.selected_roles = this.widget_options.role_access;
    }

    @Watch('show_add')
    @Watch('show_update')
    @Watch('show_delete')
    @Watch('show_manual_vo_type')
    @Watch('manual_vo_type')
    @Watch('show_add_edit_fk')
    @Watch('selected_roles')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.show_add != this.show_add ||
            this.widget_options.show_update != this.show_update ||
            this.widget_options.show_delete != this.show_delete ||
            this.widget_options.show_manual_vo_type != this.show_manual_vo_type ||
            this.widget_options.show_add_edit_fk != this.show_add_edit_fk ||
            this.widget_options.manual_vo_type != this.manual_vo_type ||
            this.widget_options.role_access != this.selected_roles
        ) {
            this.next_update_options.show_add = this.show_add;
            this.next_update_options.show_update = this.show_update;
            this.next_update_options.show_delete = this.show_delete;
            this.next_update_options.show_manual_vo_type = this.show_manual_vo_type;
            this.next_update_options.manual_vo_type = this.manual_vo_type;
            this.next_update_options.show_add_edit_fk = this.show_add_edit_fk;
            this.next_update_options.role_access = this.selected_roles;

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        this.list_roles = await query(RoleVO.API_TYPE_ID).select_vos();

        await this.throttled_update_options();
    }

    private get_default_options(): CMSCrudButtonsWidgetOptionsVO {
        return CMSCrudButtonsWidgetOptionsVO.createNew(
            false,
            false,
            false,
            false,
            null,
            true,
            [],
        );
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(ModuleTableController.module_tables_by_vo_type[api_type_id].label.code_text);
    }

    private async switch_show_add_edit_fk() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_add_edit_fk = !this.next_update_options.show_add_edit_fk;

        await this.throttled_update_options();
    }

    private async switch_show_add() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_add = !this.next_update_options.show_add;

        await this.throttled_update_options();
    }

    private async switch_show_update() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_update = !this.next_update_options.show_update;

        await this.throttled_update_options();
    }

    private async switch_show_delete() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_delete = !this.next_update_options.show_delete;

        await this.throttled_update_options();
    }

    private async switch_show_manual_vo_type() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.show_manual_vo_type = !this.next_update_options.show_manual_vo_type;

        await this.throttled_update_options();
    }

    private multiselectRoleOptionLabel(filter_item: RoleVO): string {
        return this.label(filter_item.translatable_name);
    }
}