import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSLikeButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSLikeButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import './CMSLikeButtonWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSLikeButtonWidgetOptionsComponent.pug')
})
export default class CMSLikeButtonWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    public color: string = null;
    public icon_color: string = null;
    public user_list: NumRange[] = [];
    public radius: number = null;

    public next_update_options: CMSLikeButtonWidgetOptionsVO = null;
    public throttled_update_options = ThrottleHelper.declare_throttle_without_args('CMSLikeButtonWidgetOptionsComponent.update_options', this.update_options.bind(this), 50, false);

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

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
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
    public async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.user_list != this.user_list ||
            this.widget_options.radius != this.radius ||
            this.widget_options.color != this.color) {

            this.next_update_options.color = this.color;
            this.next_update_options.user_list = this.user_list;
            this.next_update_options.radius = this.radius;

            await this.throttled_update_options();
        }
    }

    public async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    public get_default_options(): CMSLikeButtonWidgetOptionsVO {

        return CMSLikeButtonWidgetOptionsVO.createNew(
            '#003c7d',
            [],
            90,
        );
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

    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);
    }

}