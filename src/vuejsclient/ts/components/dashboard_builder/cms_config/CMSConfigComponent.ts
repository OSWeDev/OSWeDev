import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import DashboardBuilderBoardComponent from '../board/DashboardBuilderBoardComponent';
import DroppableVoFieldsComponent from '../droppable_vo_fields/DroppableVoFieldsComponent';
import DashboardMenuConfComponent from '../menu_conf/DashboardMenuConfComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import DashboardSharedFiltersComponent from '../shared_filters/DashboardSharedFiltersComponent';
import TablesGraphComponent from '../tables_graph/TablesGraphComponent';
import DashboardBuilderWidgetsComponent from '../widgets/DashboardBuilderWidgetsComponent';
import './CMSConfigComponent.scss';
import LinkDashboardAndApiTypeIdVO from '../../../../../shared/modules/DashboardBuilder/vos/LinkDashboardAndApiTypeIdVO';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ObjectHandler, { field_names } from '../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardGraphVORefVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import ModuleTableController from '../../../../../shared/modules/DAO/ModuleTableController';
import { cloneDeep } from 'lodash';

@Component({
    template: require('./CMSConfigComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Dashboardbuilderwidgetscomponent: DashboardBuilderWidgetsComponent,
        Dashboardbuilderboardcomponent: DashboardBuilderBoardComponent,
        Tablesgraphcomponent: TablesGraphComponent,
        Dashboardmenuconfcomponent: DashboardMenuConfComponent,
        Dashboardsharedfilterscomponent: DashboardSharedFiltersComponent,
    },
})
export default class CMSConfigComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_discarded_field_paths: (discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_dashboard_api_type_ids: (dashboard_api_type_ids: string[]) => void;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private dashboard_id: string;

    private link_ddb_api_type_id: { [api_type_id: string]: LinkDashboardAndApiTypeIdVO } = {};
    private dbbs: DashboardVO[] = [];
    private dbb_by_api_type_id: { [api_type_id: string]: DashboardVO } = {};

    private async onchange_dbb_by_api_type_id() {
        const todelete: LinkDashboardAndApiTypeIdVO[] = [];
        const new_link_ddb_api_type_id: { [api_type_id: string]: LinkDashboardAndApiTypeIdVO } = {};

        for (const api_type_id in this.dbb_by_api_type_id) {
            const dbb: DashboardVO = this.dbb_by_api_type_id[api_type_id];

            if (!this.link_ddb_api_type_id[api_type_id]) {
                // Si je n'ai pas d'ID, je n'essaye pas d'enregistrer un truc, ça ne sert à rien
                if (!dbb?.id) {
                    continue;
                }

                new_link_ddb_api_type_id[api_type_id] = LinkDashboardAndApiTypeIdVO.createNew(dbb.id, api_type_id);
            } else {
                new_link_ddb_api_type_id[api_type_id] = cloneDeep(this.link_ddb_api_type_id[api_type_id]);
            }

            if (!dbb?.id) {
                todelete.push(this.link_ddb_api_type_id[api_type_id]);
                continue;
            }

            new_link_ddb_api_type_id[api_type_id].dashboard_id = dbb?.id;
        }

        if (todelete?.length) {
            await ModuleDAO.getInstance().deleteVOs(todelete);
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(ObjectHandler.arrayFromMap(new_link_ddb_api_type_id));

        this.link_ddb_api_type_id = new_link_ddb_api_type_id;
    }

    private async mounted() {
        this.startLoading();

        const promises = [];

        promises.push((async () => {
            this.link_ddb_api_type_id = ObjectHandler.mapByStringFieldFromArray(
                await query(LinkDashboardAndApiTypeIdVO.API_TYPE_ID).select_vos(),
                field_names<LinkDashboardAndApiTypeIdVO>().api_type_id
            );
        })());

        promises.push((async () => {
            this.dbbs = await query(DashboardVO.API_TYPE_ID)
                .field(field_names<DashboardVO>().id)
                .filter_is_true(field_names<DashboardVO>().is_cms_compatible)
                .select_vos();
        })());

        promises.push((async () => {
            const dbb_graphs_cms: DashboardGraphVORefVO[] = await query(DashboardGraphVORefVO.API_TYPE_ID)
                .filter_by_num_in(
                    field_names<DashboardGraphVORefVO>().dashboard_id,
                    query(DashboardVO.API_TYPE_ID)
                        .field(field_names<DashboardVO>().id)
                        .filter_is_true(field_names<DashboardVO>().is_cms_compatible)
                        .set_limit(1)
                )
                .select_vos();

            const dashboard_api_type_ids: string[] = [];

            for (const i in dbb_graphs_cms) {
                if (!dashboard_api_type_ids.includes(dbb_graphs_cms[i].vo_type)) {
                    dashboard_api_type_ids.push(dbb_graphs_cms[i].vo_type);
                }
            }

            this.set_dashboard_api_type_ids(dashboard_api_type_ids);
        })());

        await all_promises(promises);

        const dbb_by_ids: { [id: number]: DashboardVO } = VOsTypesManager.vosArray_to_vosByIds(this.dbbs);

        for (const api_type_id in this.link_ddb_api_type_id) {
            if (this.link_ddb_api_type_id[api_type_id].dashboard_id) {
                this.dbb_by_api_type_id[api_type_id] = dbb_by_ids[this.link_ddb_api_type_id[api_type_id].dashboard_id];
            }
        }

        this.stopLoading();
    }

    private async add_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            this.set_dashboard_api_type_ids([]);
        }
        if (this.get_dashboard_api_type_ids.indexOf(api_type_id) >= 0) {
            return;
        }
        const tmp = Array.from(this.get_dashboard_api_type_ids);
        tmp.push(api_type_id);
        this.set_dashboard_api_type_ids(tmp);
    }

    private async del_api_type_id(api_type_id: string) {
        if (!this.get_dashboard_api_type_ids) {
            return;
        }
        this.set_dashboard_api_type_ids(this.get_dashboard_api_type_ids.filter((ati) => ati != api_type_id));
    }

    private async update_discarded_field_paths(discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } }) {
        this.set_discarded_field_paths(discarded_field_paths);
    }

    private multiselectOptionLabel(filter_item: DashboardVO): string {
        if ((filter_item == null) || (typeof filter_item == 'undefined')) {
            return '';
        }

        return this.t(filter_item.translatable_name_code_text);
    }

    private get_table_label(api_type_id: string) {
        if (!ModuleTableController.module_tables_by_vo_type[api_type_id]?.label?.code_text) {
            return api_type_id;
        }

        return this.t(ModuleTableController.module_tables_by_vo_type[api_type_id].label.code_text);
    }
}