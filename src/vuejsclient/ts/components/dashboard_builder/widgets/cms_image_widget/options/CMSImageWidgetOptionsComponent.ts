import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSImageWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSImageWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSImageWidgetOptionsComponent.pug')
})
export default class CMSImageWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private file_id: number = null;
    private radius: number = null;

    private next_update_options: CMSImageWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSImageWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSImageWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSImageWidgetOptionsVO;
                options = options ? new CMSImageWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = 0;

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;
    }

    @Watch('file_id')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.file_id != this.file_id ||
            this.widget_options.file_id != this.file_id) {

            this.next_update_options.file_id = this.file_id;
            this.next_update_options.radius = this.radius;

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

    private get_default_options(): CMSImageWidgetOptionsVO {
        return CMSImageWidgetOptionsVO.createNew(
            null,
            0,
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

}