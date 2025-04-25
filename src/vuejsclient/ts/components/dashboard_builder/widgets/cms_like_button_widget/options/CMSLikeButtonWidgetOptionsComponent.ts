import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSLikeButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSLikeButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSLikeButtonWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSLikeButtonWidgetOptionsComponent.pug')
})
export default class CMSLikeButtonWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private color: string = null;
    private icon_color: string = null;
    private user_list: NumRange[] = [];
    private radius: number = null;

    private next_update_options: CMSLikeButtonWidgetOptionsVO = null;

    get widget_options(): CMSLikeButtonWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSLikeButtonWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSLikeButtonWidgetOptionsVO;
                options = options ? new CMSLikeButtonWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
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

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.color = '#003c7d';
            this.radius = 0;
            this.user_list = [];

            return;
        }
        this.color = this.widget_options.color;
        this.radius = this.widget_options.radius;
        this.user_list = this.widget_options.user_list;
    }

    @Watch('color')
    @Watch('user_list')
    @Watch('radius')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.user_list != this.user_list ||
            this.widget_options.radius != this.radius ||
            this.widget_options.color != this.color) {

            this.next_update_options.color = this.color;
            this.next_update_options.user_list = this.user_list;
            this.next_update_options.radius = this.radius;

            this.update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        this.update_options();
    }

    private get_default_options(): CMSLikeButtonWidgetOptionsVO {

        return CMSLikeButtonWidgetOptionsVO.createNew(
            '#003c7d',
            [],
            90,
        );
    }
}