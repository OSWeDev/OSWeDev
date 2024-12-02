import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ListObjectWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/ListObjectWidgetOptionsVO';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './ListObjectWidgetComponent.scss';

@Component({
    template: require('./ListObjectWidgetComponent.pug'),
    components: {}
})
export default class ListObjectWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    private next_update_options: ListObjectWidgetOptionsVO = null;

    private titles: any[] = [];
    private subtitles: any[] = [];
    private image_paths: string[] = [];
    private numbers: any[] = [];
    private urls: any[] = [];
    private max_range_nb: number[] = [];

    private throttle_reload_values = ThrottleHelper.declare_throttle_without_args(this.reload_values.bind(this), 300, { leading: false });

    get widget_options(): ListObjectWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: ListObjectWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ListObjectWidgetOptionsVO;
                options = options ? new ListObjectWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get sort_by_asc(): boolean {
        if (this.widget_options.sort_dimension_by == 'Ascending') {
            return true;
        } else {
            return false;
        }
    }

    @Watch('widget_options')
    @Watch('get_active_field_filters', { immediate: true, deep: true })
    private onchange_widget_options() {
        this.throttle_reload_values();
    }

    private async reload_values() {
        if (!this.widget_options) {
            return;
        }

        this.titles = await this.get_titles();
        this.subtitles = await this.get_subtitles();
        this.image_paths = await this.get_image_paths();
        this.numbers = await this.get_numbers();
        this.urls = await this.get_urls();
        this.max_range_nb = Array.from({ length: Math.max(...[this.titles.length, this.subtitles.length, this.image_paths.length, this.numbers.length, this.urls.length]) }, (x, i) => i);
    }

    private async get_titles() {
        if (!this.widget_options.title || !this.widget_options.title.api_type_id || !this.widget_options.title.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.title.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const titles = await query_.select_vos();
        const res = [];
        for (const title of titles) {
            res.push(title[this.widget_options.title.field_id]);
        }
        return res;
    }

    private async get_subtitles() {
        if (!this.widget_options.subtitle || !this.widget_options.subtitle.api_type_id || !this.widget_options.subtitle.field_id) {
            return [];
        }

        const query_ = await query(this.widget_options.subtitle.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const subtitles = await query_.select_vos();
        const res = [];
        for (const subtitle of subtitles) {
            res.push(subtitle[this.widget_options.subtitle.field_id]);
        }
        return res;
    }

    private async get_image_paths() {
        if (!this.widget_options.image_id || !this.widget_options.image_id.api_type_id || !this.widget_options.image_id.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.image_id.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const images = await query_.select_vos();
        const res: string[] = [];
        const field: ModuleTableFieldVO = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[this.widget_options.image_id.api_type_id][this.widget_options.image_id.field_id];
        const promises = [];

        for (const image of images) {
            if (!image[this.widget_options.image_id.field_id]) {
                res.push(null);
                continue;
            }

            switch (field.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                case ModuleTableFieldVO.FIELD_TYPE_file_ref:

                    const file: FileVO = await query(field.foreign_ref_vo_type).filter_by_id(image[this.widget_options.image_id.field_id]).select_vo();
                    res.push(file?.path);
                    break;

                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_image_field:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                    res.push(image[this.widget_options.image_id.field_id]);
                    break;
            }
        }

        if (promises?.length) {
            await all_promises(promises);
        }

        return res;
    }

    private async get_numbers() {
        if (!this.widget_options.number || !this.widget_options.number.api_type_id || !this.widget_options.number.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.number.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const numbers = await query_.select_vos();
        const res = [];
        for (const number of numbers) {
            res.push(number[this.widget_options.number.field_id]);
        }
        return res;
    }

    private async get_urls() {
        if (!this.widget_options.url || !this.widget_options.url.api_type_id || !this.widget_options.url.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.url.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const urls = await query_.select_vos();
        const res = [];
        for (const url of urls) {
            res.push(url[this.widget_options.url.field_id]);
        }
        return res;
    }
}