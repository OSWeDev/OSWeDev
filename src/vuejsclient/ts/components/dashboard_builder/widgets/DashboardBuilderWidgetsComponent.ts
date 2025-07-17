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
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../page/DashboardPageStore';
import './DashboardBuilderWidgetsComponent.scss';
import { SyncVOs } from '../../../tools/annotations/SyncVOs';
import DashboardWidgetTagVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetTagVO';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import { ModuleModalsAndBasicPageComponentsHolderGetter } from '../../modals_and_basic_page_components_holder/ModalsAndBasicPageComponentsHolderStore';
import CRUDUpdateModalComponent from './table_widget/crud_modals/update/CRUDUpdateModalComponent';
import { ModuleDAOAction } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';

@Component({
    template: require('./DashboardBuilderWidgetsComponent.pug'),
    components: {
    }
})
export default class DashboardBuilderWidgetsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleModalsAndBasicPageComponentsHolderGetter
    public get_Crudupdatemodalcomponent: CRUDUpdateModalComponent;

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @SyncVOs(DashboardWidgetTagVO.API_TYPE_ID)
    public dashboard_widget_tags: DashboardWidgetTagVO[] = [];

    public selected_widget_tag: DashboardWidgetTagVO = null;

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }
    get get_dashboard(): DashboardVO {
        return this.vuexGet(reflect<this>().get_dashboard);
    }
    get get_dashboard_pages(): DashboardPageVO[] {
        return this.vuexGet(reflect<this>().get_dashboard_pages);
    }

    get get_all_widgets(): DashboardWidgetVO[] {
        return this.vuexGet(reflect<this>().get_all_widgets);
    }

    get get_selected_widget(): DashboardPageWidgetVO {
        return this.vuexGet(reflect<this>().get_selected_widget);
    }

    get get_dashboard_current_viewport(): DashboardViewportVO {
        return this.vuexGet(reflect<this>().get_dashboard_current_viewport);
    }

    get get_widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return this.vuexGet(reflect<this>().get_widgets_by_id);
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

    get tagged_widgets(): DashboardWidgetVO[] {
        if (!this.selected_widget_tag) {
            return this.get_all_widgets;
        }

        return this.get_all_widgets.filter(widget => {
            if (!widget.tags_id_ranges || widget.tags_id_ranges.length === 0) {
                return false;
            }
            return RangeHandler.elt_intersects_any_range(this.selected_widget_tag.id, widget.tags_id_ranges);
        });
    }

    //- Au clic droit sur le .widget(data-widget-id), on veut ouvrir la modale de crud pour modifier le widget
    public onWidgetRightClick(widget: DashboardWidgetVO, event: MouseEvent) {
        event.preventDefault();
        this.edit_widget(widget);
    }

    public async edit_widget(widget: DashboardWidgetVO) {
        await this.get_Crudupdatemodalcomponent.open_modal(
            widget,
            this.storeDatas,
            null,
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

    public set_selected_widget(page_widget: DashboardPageWidgetVO) {
        this.vuexAct(reflect<this>().set_selected_widget, page_widget);
    }

    public switch_select_widget_tag(tag: DashboardWidgetTagVO) {
        if (this.selected_widget_tag && this.selected_widget_tag.id === tag.id) {
            this.selected_widget_tag = null;
        } else {
            this.selected_widget_tag = tag;
        }
    }

    public async add_widget_to_page(widget: DashboardWidgetVO) {

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

    public close_widget_options() {
        this.set_selected_widget(null);
    }
}