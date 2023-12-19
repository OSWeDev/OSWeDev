import { cloneDeep, isEqual, isEmpty } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import LogVO from '../../../../../../shared/modules/LogMonitoring/vos/LogVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import ModuleLogMonitoring from '../../../../../../shared/modules/LogMonitoring/ModuleLogMonitoring';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import VueComponentBase from '../../../VueComponentBase';
import LogMonitoringVueModule from '../../../../../../vuejsclient/ts/modules/LogMonitoring/LogMonitoringVueModule';
import FileVO from '../../../../../../shared/modules/LogMonitoring/vos/FileVO';
import './LogMonitoringWidgetComponent.scss';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';

@Component({
    template: require('./LogMonitoringWidgetComponent.pug'),
    components: {
        Tablepaginationcomponent: TablePaginationComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class LogMonitoringWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private pagination_count: number = 0;
    private pagination_offset: number = 0;
    private limit: number = 0;
    private loaded_once: boolean = true;
    private is_busy: boolean = false;

    private log_file_select_options: FileVO[] = [];
    private log_file: FileVO = null;
    private items: LogVO[] = [
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
        { id: 1, message: 'test', level: 'DEBUG', date: 1, filename: 'test' } as any,
    ];

    /**
     * mounted
     *
     *  @returns {Promise<void>}
     */
    private async mounted(): Promise<void> {
        await this.load_log_file_select_options(); // TODO: Maybe use throttle

        this.apply_context_query();

        LogMonitoringVueModule.getInstance().apply_socket_subscriptions((items: LogVO[], total_count: number) => {
            this.handle_logs_rows(items, total_count);
        });
    }

    @Watch('log_file')
    private async onchange_log_file() {
        if (!this.log_file) {
            return;
        }

        this.apply_context_query();
    }

    /**
     * apply_context_query
     *
     * @returns {void}
     */
    private apply_context_query(): void {
        this.pagination_count = 0;
        this.pagination_offset = 0;
        this.limit = 100;
        this.loaded_once = false;
        this.is_busy = false;

        let file_context_filter: ContextFilterVO = null;

        if (this.log_file) {
            file_context_filter = filter(
                FileVO.API_TYPE_ID,
                'name',
            ).by_text_eq(this.log_file?.filename);
        }

        const context_query: ContextQueryVO = query(
            LogVO.API_TYPE_ID,
        );

        context_query.filters = ContextFilterVOManager.get_context_filters_from_active_field_filters(this.get_active_field_filters) ?? [];
        context_query.filters.push(file_context_filter);
        context_query.query_offset = this.pagination_offset;
        context_query.query_limit = this.limit;

        LogMonitoringVueModule.getInstance().apply_query_filters(context_query);
    }


    /**
     * handle_logs_rows
     *
     * @param {LogVO[]} log_rows
     */
    private async handle_logs_rows(items: LogVO[], total_count: number): Promise<void> {
        this.items = items;
    }

    private async load_log_file_select_options(): Promise<void> {
        this.log_file_select_options = await ModuleLogMonitoring.getInstance().query_log_files();
    }

    private async change_offset(offset: number) {

    }

    private get_context_filter() {

    }

    private log_file_select_label(file: FileVO): string {
        return file.filename;
    }
}