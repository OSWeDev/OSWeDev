import { Component, Prop } from "vue-property-decorator";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableVO from "../../../../shared/modules/DAO/vos/ModuleTableVO";
import DashboardVO from "../../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import { field_names, reflect } from "../../../../shared/tools/ObjectHandler";
import { SyncVO } from "../../tools/annotations/SyncVO";
import VueComponentBase from "../VueComponentBase";
import './ModuleTableQueryDBComponent.scss';
import DashboardViewerComponent from "../dashboard_builder/viewer/DashboardViewerComponent";

@Component({
    template: require('./ModuleTableQueryDBComponent.pug'),
    components: {
        DashboardViewerComponent: DashboardViewerComponent,
    }
})
export default class ModuleTableQueryDBComponent extends VueComponentBase {

    @Prop()
    public api_type_id: string;

    @SyncVO(ModuleTableVO.API_TYPE_ID, {
        watch_fields: [
            reflect<ModuleTableQueryDBComponent>().api_type_id,
        ],

        id_factory: async (self: ModuleTableQueryDBComponent) => {
            if (!self.api_type_id) {
                return null;
            }

            return await query(ModuleTableVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, self.api_type_id)
                .select_vo<ModuleTableVO>();
        },
    })
    public module_table: ModuleTableVO = null;

    @SyncVO(DashboardVO.API_TYPE_ID, {
        watch_fields: [
            reflect<ModuleTableQueryDBComponent>().api_type_id,
        ],
        id_factory: async (self: ModuleTableQueryDBComponent) => {
            if (!self.api_type_id) {
                return null;
            }

            return await query(DashboardVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<ModuleTableVO>().vo_type, self.api_type_id)
                .filter_by_num_eq(field_names<DashboardVO>().moduletable_crud_template_type, DashboardVO.MODULE_TABLE_CRUD_TEMPLATE_TYPE_QUERY)
                .select_vo<DashboardVO>();
        },
    })
    public dashboard: DashboardVO = null;
}