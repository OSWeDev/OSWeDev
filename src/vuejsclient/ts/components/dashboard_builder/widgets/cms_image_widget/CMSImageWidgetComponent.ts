import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSImageWidgetComponent.scss';
import CMSImageWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./CMSImageWidgetComponent.pug'),
    components: {}
})
export default class CMSImageWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private file_id: number = null;
    private file_path: string = null;
    private radius: number = null;

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

    get img_path(): string {
        return this.file_path ? this.file_path : null;
    }

    get img_style(): string {
        return this.radius ? 'border-radius: ' + this.radius + '%;' : '';
    }

    get widget_style(): string {
        return 'height: 100%; display: flex; justify-content: center; flex-direction: column;';
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = null;

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;

        if (this.file_id) {
            let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }
    }

    private async mounted() {
        this.onchange_widget_options();
    }

}