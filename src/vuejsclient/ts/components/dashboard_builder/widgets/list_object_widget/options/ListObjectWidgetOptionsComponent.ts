import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ListObjectWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/ListObjectWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './ListObjectWidgetOptionsComponent.scss';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import { cloneDeep } from 'lodash';

@Component({
    template: require('./ListObjectWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class ListObjectWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private display_orientation: string = "Horizontal";
    private number_of_elements: number = 10;
    private sort_dimension_by: string = null;
    private image_id: VOFieldRefVO = null;
    private title: VOFieldRefVO = null;
    private subtitle: VOFieldRefVO = null;
    private number: VOFieldRefVO = null;
    private filter_field_ref: VOFieldRefVO = null;
    private button_elements: boolean = false;
    private url: VOFieldRefVO = null;
    private blank?: boolean;

    private next_update_options: ListObjectWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private widget_options: ListObjectWidgetOptionsVO = null;


    @Watch('widget_options')
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {
        await this.throttled_reload_options();
    }

    @Watch('url')
    private async onchange_limit_selectable() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.url != this.url) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.url = this.url;

            this.throttled_update_options();
        }
    }

    @Watch('number_of_elements')
    private async onchange_number_of_elements() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.number_of_elements != this.number_of_elements) {
            this.next_update_options = cloneDeep(this.widget_options);
            this.next_update_options.number_of_elements = this.number_of_elements;

            this.throttled_update_options();
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

    private get_default_options(): ListObjectWidgetOptionsVO {
        return ListObjectWidgetOptionsVO.createNew(
            this.display_orientation = "Horizontal",
            this.number_of_elements = 10,
            this.sort_dimension_by = null,
            this.image_id = null,
            this.title = null,
            this.subtitle = null,
            this.number = null,
            this.filter_field_ref = null,
            this.button_elements = null,
            this.url = null,
            this.blank = null,
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



    private reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: ListObjectWidgetOptionsVO = null;
            try {
                if (this.page_widget?.json_options && (this.page_widget?.json_options != 'null')) {
                    options = JSON.parse(this.page_widget.json_options) as ListObjectWidgetOptionsVO;
                    if (this.widget_options &&
                        (this.widget_options.blank == options.blank) &&
                        (this.widget_options.button_elements == options.button_elements) &&
                        (this.widget_options.display_orientation == options.display_orientation) &&
                        (this.widget_options.image_id == options.image_id) &&
                        (this.widget_options.filter_field_ref == options.filter_field_ref) &&
                        (this.widget_options.number == options.number) &&
                        (this.widget_options.number_of_elements == options.number_of_elements) &&
                        (this.widget_options.sort_dimension_by == options.sort_dimension_by) &&
                        (this.widget_options.subtitle == options.subtitle) &&
                        (this.widget_options.title == options.title) &&
                        (this.widget_options.url == options.url)
                    ) {
                        options = null;
                    }

                    options = options ? ListObjectWidgetOptionsVO.createNew(
                        options.display_orientation,
                        options.number_of_elements,
                        options.sort_dimension_by,
                        options.image_id,
                        options.title,
                        options.subtitle,
                        options.number,
                        options.filter_field_ref,
                        options.button_elements,
                        options.url,
                        options.blank,
                    ) : null;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }

            if ((!!options) && (!!this.page_widget.json_options)) {
                if (!ObjectHandler.are_equal(this.widget_options, options)) {
                    this.widget_options = options;
                }
            } else if ((!!this.widget_options) && !this.page_widget.json_options) {
                this.widget_options = null;
            }
        }

        if (!this.widget_options) {
            this.next_update_options = null;
            let default_options = this.get_default_options();

            this.display_orientation = default_options.display_orientation;
            this.number_of_elements = default_options.number_of_elements;
            this.sort_dimension_by = default_options.sort_dimension_by;
            this.image_id = default_options.image_id;
            this.title = default_options.title;
            this.subtitle = default_options.subtitle;
            this.number = default_options.number;
            this.filter_field_ref = default_options.filter_field_ref;
            this.button_elements = default_options.button_elements;
            this.url = default_options.url;
            this.blank = default_options.blank;

            this.widget_options = default_options;
            return;
        }

        if (this.display_orientation != this.widget_options.display_orientation) {
            this.display_orientation = this.widget_options.display_orientation;
        }
        if (this.number_of_elements != this.widget_options.number_of_elements) {
            this.number_of_elements = this.widget_options.number_of_elements;
        }
        if (this.sort_dimension_by != this.widget_options.sort_dimension_by) {
            this.sort_dimension_by = this.widget_options.sort_dimension_by;
        }
        if (this.image_id != this.widget_options.image_id) {
            this.image_id = this.widget_options.image_id;
        }
        if (this.title != this.widget_options.title) {
            this.title = this.widget_options.title;
        }
        if (this.subtitle != this.widget_options.subtitle) {
            this.subtitle = this.widget_options.subtitle;
        }
        if (this.number != this.widget_options.number) {
            this.number = this.widget_options.number;
        }
        if (this.filter_field_ref != this.widget_options.filter_field_ref) {
            this.filter_field_ref = this.widget_options.filter_field_ref;
        }
        if (this.button_elements != this.widget_options.button_elements) {
            this.button_elements = this.widget_options.button_elements;
        }
        if (this.url != this.widget_options.url) {
            this.url = this.widget_options.url;
        }
        if (this.blank != this.widget_options.blank) {
            this.blank = this.widget_options.blank;
        }

        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }
    }

    private async switch_button_for_elements() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.button_elements = !this.next_update_options.button_elements;

        await this.throttled_update_options();
    }

    private async switch_use_blank() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.blank = !this.next_update_options.blank;

        await this.throttled_update_options();
    }

    private async change_sort_dimension(dimension: string) {
        if (!this.widget_options) {
            return;
        }
        this.next_update_options = this.widget_options;
        const accepted_dimensions = ['Ascending', 'Descending', 'Default'];
        this.next_update_options = this.widget_options;
        if (accepted_dimensions.indexOf(dimension) < 0) {
            return;
        } else {
            this.next_update_options.sort_dimension_by = dimension;
        }

        await this.throttled_update_options();
    }

    private async change_display_orientation(orientation: string) {
        if (!this.widget_options) {
            return;
        }
        this.next_update_options = this.widget_options;
        const accepted_orientations = ['Horizontal', 'Vertical'];
        this.next_update_options = this.widget_options;
        if (accepted_orientations.indexOf(orientation) < 0) {
            return;
        } else {
            this.next_update_options.display_orientation = orientation;
        }

        await this.throttled_update_options();
    }

    private async remove_title_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.title) {
            return null;
        }

        this.next_update_options.title = null;

        await this.throttled_update_options();
    }

    private async add_title_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.title = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get title_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.title)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.title);
    }

    private async remove_subtitle_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.subtitle) {
            return null;
        }

        this.next_update_options.subtitle = null;

        await this.throttled_update_options();
    }

    private async add_subtitle_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.subtitle = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get subtitle_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.subtitle)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.subtitle);
    }

    private async remove_image_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.image_id) {
            return null;
        }

        this.next_update_options.image_id = null;

        await this.throttled_update_options();
    }

    private async add_image_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.image_id = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get image_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.image_id)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.image_id);
    }

    private async remove_number_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.number) {
            return null;
        }

        this.next_update_options.number = null;

        await this.throttled_update_options();
    }

    private async add_number_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.number = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get number_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.number)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.number);
    }

    private async remove_url_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.url) {
            return null;
        }

        this.next_update_options.url = null;

        await this.throttled_update_options();
    }

    private async add_url_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.url = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get url_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.url)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.url);
    }

    private async remove_filter_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.filter_field_ref) {
            return null;
        }

        this.next_update_options.filter_field_ref = null;

        await this.throttled_update_options();
    }

    private async add_filter_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;

        this.next_update_options.filter_field_ref = dimension_vo_field_ref;

        await this.throttled_update_options();
    }


    get _filter_field_ref(): VOFieldRefVO {
        const options: ListObjectWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.filter_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.filter_field_ref);
    }

}