import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../VueComponentBase';
import './DashboardBuilderWidgetsComponent.scss';

@Component({
    template: require('./DashboardBuilderWidgetsComponent.pug'),
    components: {
    }
})
export default class DashboardBuilderWidgetsComponent extends VueComponentBase {

    @Prop()
    private page_id: number;

    private widgets: DashboardWidgetVO[] = null;

    private loading: boolean = true;

    private async mounted() {

        this.widgets = await ModuleDAO.getInstance().getVos<DashboardWidgetVO>(DashboardWidgetVO.API_TYPE_ID);

        this.loading = false;
    }

    private async add_widget_to_page(widget: DashboardWidgetVO) {

        let page_widget = new DashboardPageWidgetVO();

        page_widget.page_id = this.page_id;
        page_widget.widget_id = widget.id;

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(page_widget);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('DashboardBuilderWidgetsComponent.add_widget_to_page.ko'));
            return;
        }
        page_widget = await ModuleDAO.getInstance().getVoById<DashboardPageWidgetVO>(DashboardPageWidgetVO.API_TYPE_ID, insertOrDeleteQueryResult.id);

        this.snotify.success(this.label('DashboardBuilderWidgetsComponent.add_widget_to_page.ok'));
        this.$emit("added_widget_to_page", page_widget);
    }

    get widgets_name(): string[] {
        let res: string[] = [];

        for (let i in this.widgets) {
            let widget = this.widgets[0];

            res.push(this.label(widget.translatable_name_code_text ? widget.translatable_name_code_text : null));
        }

        return res;
    }
}