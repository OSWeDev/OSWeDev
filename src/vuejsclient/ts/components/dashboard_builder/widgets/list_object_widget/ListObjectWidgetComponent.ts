import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import TableWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import ListObjectWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/ListObjectWidgetOptionsVO';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
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

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    private next_update_options: ListObjectWidgetOptionsVO = null;

    private titles: any[] = [];
    private subtitles: any[] = [];
    private surtitres: any[] = [];
    private image_paths: string[] = [];
    private numbers: any[] = [];
    private urls: any[] = [];
    private nb_elements: number[] = [];
    private current_element: number = 0;

    private is_card_display_single: boolean = false;

    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

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

    get TYPE_DISPLAY_CARD() {
        return ListObjectWidgetOptionsVO.TYPE_DISPLAY_CARD;
    }

    get TYPE_DISPLAY_LIST() {
        return ListObjectWidgetOptionsVO.TYPE_DISPLAY_LIST;
    }

    get all_page_widgets_by_id(): { [id: number]: DashboardPageWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(this.all_page_widget);
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    @Watch('widget_options')
    @Watch('get_active_field_filters', { immediate: true, deep: true })
    private onchange_widget_options() {
        this.throttle_do_update_visible_options();
    }

    private async do_update_visible_options() {
        if (!this.widget_options) {
            return;
        }

        const promises = [];

        promises.push((async () => {
            this.titles = await this.get_titles();
        })());

        promises.push((async () => {
            this.subtitles = await this.get_subtitles();
        })());

        promises.push((async () => {
            this.surtitres = await this.get_surtitres();
        })());

        promises.push((async () => {
            this.image_paths = await this.get_image_paths();
        })());

        promises.push((async () => {
            this.numbers = await this.get_numbers();
        })());

        promises.push((async () => {
            this.urls = await this.get_urls();
        })());

        this.is_card_display_single = this.widget_options.is_card_display_single;

        await Promise.all(promises);

        this.nb_elements = Array.from({ length: Math.max(...[this.titles.length, this.subtitles.length, this.surtitres.length, this.image_paths.length, this.numbers.length, this.urls.length]) }, (x, i) => i);
    }

    private previous_card_single_display() {
        if (this.current_element > 0) {
            this.current_element--;
        }
    }

    private next_card_single_display() {
        if (this.current_element < this.nb_elements.length - 1) {
            this.current_element++;
        }
    }

    private getTransformStyle(): string {
        return "transform: translateX(-" + (this.current_element * 100) + "vw);";
    }

    private async get_titles() {
        if (!this.widget_options.title || !this.widget_options.title.api_type_id || !this.widget_options.title.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.title.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const titles = await query_.select_vos();

        return this.get_values_formatted(titles, this.widget_options.title.field_id, this.widget_options.title.api_type_id);
    }

    private async get_subtitles() {
        if (!this.widget_options.subtitle || !this.widget_options.subtitle.api_type_id || !this.widget_options.subtitle.field_id) {
            return [];
        }

        const query_ = await query(this.widget_options.subtitle.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))
            ));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const subtitles = await query_.select_vos();

        return this.get_values_formatted(subtitles, this.widget_options.subtitle.field_id, this.widget_options.subtitle.api_type_id);
    }

    private async get_surtitres() {
        if (!this.widget_options.surtitre || !this.widget_options.surtitre.api_type_id || !this.widget_options.surtitre.field_id) {
            return [];
        }

        const query_ = await query(this.widget_options.surtitre.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))
            ));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const surtitres = await query_.select_vos();

        const res = this.get_values_formatted(surtitres, this.widget_options.surtitre.field_id, this.widget_options.surtitre.api_type_id);

        if (this.widget_options?.symbole_surtitre != '' && this.widget_options?.symbole_surtitre != null && this.widget_options?.symbole_surtitre != undefined) {
            for (const i in res) {
                res[i] = res[i] + ' ' + this.widget_options?.symbole_surtitre;
            }
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
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))
            ));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

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
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))
            ));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const numbers = await query_.select_vos();

        return this.get_values_formatted(numbers, this.widget_options.number.field_id, this.widget_options.number.api_type_id);
    }

    private async get_urls() {
        if (!this.widget_options.url || !this.widget_options.url.api_type_id || !this.widget_options.url.field_id) {
            return [];
        }
        const query_ = await query(this.widget_options.url.api_type_id)
            .set_limit(this.widget_options.number_of_elements)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(
                    TableWidgetManager.get_active_field_filters(
                        this.get_active_field_filters,
                        this.widget_options.do_not_use_page_widget_ids,
                        this.all_page_widgets_by_id,
                        this.widgets_by_id,
                    ))
            ));

        if (this.get_cms_vo && this.widget_options?.filter_on_cmv_vo && this.widget_options?.field_filter_cmv_vo) {
            query_.filter_by_num_eq(this.widget_options.field_filter_cmv_vo.field_id, this.get_cms_vo.id);
        }

        if (this.widget_options?.filter_on_distant_vo && this.widget_options?.field_filter_distant_vo) {
            query_.filter_by_id_in(
                query(this.widget_options.field_filter_distant_vo.api_type_id)
                    .filter_by_id(this.get_cms_vo.id)
                    .field(this.widget_options.field_filter_distant_vo.field_id)
            );
        }

        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by && this.widget_options.sort_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_field_ref.api_type_id,
                this.widget_options.sort_field_ref.field_id,
                this.sort_by_asc
            ));
        }

        const urls = await query_.select_vos();

        return this.get_values_formatted(urls, this.widget_options.url.field_id, this.widget_options.url.api_type_id);
    }

    private get_values_formatted(vos: IDistantVOBase[], field_id: string, api_type_id: string) {
        const res = [];
        const field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field_id)
            .setModuleTable(ModuleTableController.module_tables_by_vo_type[api_type_id]);

        for (const vo of vos) {
            res.push(field.dataToReadIHM(vo[field_id], vo));
        }

        return res;
    }
}