import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import WidgetOptionsVOManager from '../../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardViewportPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportPageWidgetVO';
import DashboardViewportVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardViewportVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../VueComponentBase';
import './DashboardBuilderWidgetsComponent.scss';

@Component({
    template: require('./DashboardBuilderWidgetsComponent.pug'),
    components: {
    }
})
export default class DashboardBuilderWidgetsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    get get_dashboard_page(): DashboardVO {
        return this.vuexGet<DashboardVO>(reflect<this>().get_dashboard_page);
    }
    get get_dashboard(): DashboardPageVO {
        return this.vuexGet<DashboardPageVO>(reflect<this>().get_dashboard);
    }
    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet<DashboardPageVO[]>(reflect<this>().get_dashboard_pages);
    }

    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet<DashboardWidgetVO[]>(reflect<this>().get_all_widgets);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet<DashboardPageWidgetVO>(reflect<this>().get_selected_widget);
    }

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet<DashboardViewportVO>(reflect<this>().get_dashboard_current_viewport);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet<{ [id: number]: DashboardWidgetVO }>(reflect<this>().get_widgets_by_id);
    }

    get selected_widget_type(): DashboardWidgetVO {
        if (!this.get_selected_widget) {
            return null;
        }

        if (!this.get_widgets_by_id) {
            return null;
        }

        return this.get_widgets_by_id[this.get_selected_widget.widget_id];
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        this.vuexAct<DashboardPageWidgetVO>(reflect<this>().set_selected_widget, page_widget);
    }

    private async add_widget_to_page(widget: DashboardWidgetVO) {

        if (!this.get_dashboard_page) {
            return null;
        }

        if (!this.get_dashboard_current_viewport) {
            return null;
        }

        if (!widget) {
            return null;
        }

        const self = this;
        const page_widget = new DashboardPageWidgetVO();

        self.snotify.async(
            self.label('DashboardBuilderBoardComponent.add_widget_to_page.start'), () => new Promise(async (resolve, reject) => {
                try {
                    page_widget.page_id = self.get_dashboard_page.id;
                    page_widget.widget_id = widget.id;

                    try {
                        if (WidgetOptionsVOManager.widgets_options_constructor[widget?.name]) {
                            const options = WidgetOptionsVOManager.widgets_options_constructor[widget?.name]();
                            page_widget.json_options = JSON.stringify(options);
                        }
                    } catch (error) {
                        ConsoleHandler.error(error);
                    }

                    await ModuleDAO.instance.insertOrUpdateVO(page_widget);

                    if ((!page_widget) || (!page_widget.id)) {
                        throw new Error('Failed to create page widget');
                    }

                    // on active le viewport page widget
                    const new_viewport_page_widget: DashboardViewportPageWidgetVO = await query(DashboardViewportPageWidgetVO.API_TYPE_ID)
                        .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().page_widget_id, page_widget.id)
                        .filter_by_num_eq(field_names<DashboardViewportPageWidgetVO>().viewport_id, self.get_dashboard_current_viewport.id)
                        .select_vo<DashboardViewportPageWidgetVO>();
                    if (!new_viewport_page_widget) {
                        throw new Error('No viewport page widget found for the newly created page widget');
                    }

                    if (!new_viewport_page_widget.activated) {
                        new_viewport_page_widget.activated = true;
                        await ModuleDAO.instance.insertOrUpdateVO(new_viewport_page_widget);
                    }
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('DashboardBuilderBoardComponent.add_widget_to_page.ko'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return null;
                }

                resolve({
                    body: self.label('DashboardBuilderBoardComponent.add_widget_to_page.ok'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );

        self.set_selected_widget(page_widget);

    }

    private close_widget_options() {
        this.set_selected_widget(null);
    }
}