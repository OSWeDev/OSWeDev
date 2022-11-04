import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../../widgets/table_widget/crud_modals/create/CRUDCreateModalComponent';
import './DashboardBuilderBoardItemComponent.scss';

@Component({
    template: require('./DashboardBuilderBoardItemComponent.pug'),
    components: {}
})

export default class DashboardBuilderBoardItemComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop()
    private dashboard_page: DashboardPageVO;

    @Prop()
    private dashboard_pages: DashboardPageVO[];

    @Prop()
    private dashboard: DashboardVO;

    @Prop()
    private page_widget: DashboardPageWidgetVO;



    @Prop({ default: true })
    private is_edit_mode: boolean;

    @Prop({ default: false })
    private is_selected: boolean;


    private widget: DashboardWidgetVO = null;

    @Watch('page_widget', { immediate: true })
    private async onchange_widget() {
        if (!this.page_widget) {
            return;
        }

        this.widget = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_id(this.page_widget.widget_id).select_vo<DashboardWidgetVO>();
    }

    private delete_widget() {
        this.$emit('delete_widget', this.page_widget);
    }

    private select_widget() {
        // event.stopPropagation();

        this.$emit('select_widget', this.page_widget);
    }

    private select_page(page) {
        this.$emit('select_page', page);
    }



    private async copy_widget() {
        await this.get_Crudcreatemodalcomponent.open_copy_modal(this.page_widget, this.dashboard_pages, null);

        // this.$emit('copy_widget', this.page_widget);
    }

}