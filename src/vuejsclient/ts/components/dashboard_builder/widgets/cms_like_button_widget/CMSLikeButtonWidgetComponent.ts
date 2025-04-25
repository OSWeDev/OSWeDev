import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSLikeButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSLikeButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSLikeButtonWidgetComponent.scss';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import NumSegment from '../../../../../../shared/modules/DataRender/vos/NumSegment';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import Throttle from '../../../../../../shared/annotations/Throttle';
import EventifyEventListenerConfVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';

@Component({
    template: require('./CMSLikeButtonWidgetComponent.pug'),
    components: {}
})
export default class CMSLikeButtonWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    private color: string = null;
    private nb_likes: number = 0;
    private user_list: NumRange[] = [];
    private radius: number = null;
    private user_liked: boolean = false;
    private user_id: number = null;

    private next_update_options: CMSLikeButtonWidgetOptionsVO = new CMSLikeButtonWidgetOptionsVO();

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

        this.$emit('update_layout_widget', this.page_widget);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.color = '#003c7d';
            this.user_list = [];
            this.radius = null;

            return;
        }

        this.color = this.widget_options.color;
        this.user_list = this.widget_options.user_list;
        this.radius = this.widget_options.radius;

        this.next_update_options.color = this.widget_options.color;
        this.next_update_options.user_list = this.widget_options.user_list;
        this.next_update_options.radius = this.widget_options.radius;
    }

    private async mounted() {
        this.user_id = await ModuleAccessPolicy.getInstance().getLoggedUserId();

        if (this.user_list && this.user_list.length) {
            const ranges_exploded: number[] = RangeHandler.get_all_segmented_elements_from_ranges(this.user_list);
            // Si l'utilisateur est dans la liste des utilisateurs qui ont liké
            this.user_liked = ranges_exploded.indexOf(this.user_id) >= 0;
            this.nb_likes = ranges_exploded.length;
        }

        this.onchange_widget_options();
    }

    private async switch_like() {
        if (!this.widget_options) {
            return;
        }

        const like_button = document.getElementById('like_button');
        const like_icon = document.getElementById('like_icon');

        let ranges_exploded: number[] = RangeHandler.get_all_segmented_elements_from_ranges(this.user_list);

        if (this.user_liked) {
            // On retire le like de la liste
            ranges_exploded = ranges_exploded.filter((id) => id != this.user_id);
            this.nb_likes--;

            like_button.style.backgroundColor = "white";
            like_button.style.border = '1px solid ' + this.color;
            like_icon.style.color = this.color;
        } else {
            // On ajoute le like à la liste
            if (!ranges_exploded) {
                ranges_exploded = [];
            }
            ranges_exploded.push(this.user_id);
            this.nb_likes++;

            like_button.style.backgroundColor = this.color;
            like_button.style.border = 'none';
            like_icon.style.color = 'white';
        }

        this.user_liked = !this.user_liked;
        this.user_list = RangeHandler.create_multiple_NumRange_from_ids(ranges_exploded, NumSegment.TYPE_INT);

        this.next_update_options.user_list = this.user_list;

        this.update_options();
    }
}