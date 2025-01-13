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
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSCrudButtonsWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSCrudButtonsWidgetOptionsComponent.pug')
})
export default class CMSCrudButtonsWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private show_add: boolean = false;
    private show_update: boolean = false;
    private show_delete: boolean = false;

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

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.show_add = false;
            this.show_update = false;
            this.show_delete = false;

            return;
        }
        this.show_add = this.widget_options.show_add;
        this.show_update = this.widget_options.show_update;
        this.show_delete = this.widget_options.show_delete;
    }

    @Watch('show_add')
    @Watch('show_update')
    @Watch('show_delete')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.show_add != this.show_add ||
            this.widget_options.show_update != this.show_update ||
            this.widget_options.show_delete != this.show_delete
        ) {
            this.next_update_options.show_add = this.show_add;
            this.next_update_options.show_update = this.show_update;
            this.next_update_options.show_delete = this.show_delete;

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    private get_default_options(): CMSCrudButtonsWidgetOptionsVO {
        return CMSCrudButtonsWidgetOptionsVO.createNew(
            false,
            false,
            false,
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
}