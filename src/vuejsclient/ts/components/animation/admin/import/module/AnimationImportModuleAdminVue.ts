import moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import AnimationImportModuleVO from '../../../../../../../shared/modules/Animation/import/Module/vos/AnimationImportModuleVO';
import DataImportAdminVueModule from '../../../../data_import/DataImportAdminVueModule';
import { ModuleDataImportAction } from '../../../../data_import/store/DataImportStore';
import VueComponentBase from '../../../../VueComponentBase';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../../../../shared/tools/TimeSegmentHandler';
import DataImportComponent from '../../../../data_import/component/DataImportComponent';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationThemeVO from '../../../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ExportDataToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import AppVuexStoreManager from '../../../../../store/AppVuexStoreManager';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { namespace } from 'vuex-class/lib/bindings';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./AnimationImportModuleAdminVue.pug'),
    components: {
        data_import_component: DataImportComponent,
    }
})
export default class AnimationImportModuleAdminVue extends VueComponentBase {
    public static ROUTE_PATH_IMPORT: string = "/importModuleAnimation";
    public static ROUTE_NAME_IMPORT: string = 'importModuleAnimation';

    @ModuleDataImportAction
    public setsegment_type: (segment_type: number) => void;
    @ModuleDataImportAction
    public setsegment_offset: (segment_offset: number) => void;
    @ModuleDataImportAction
    public setlower_segment: (lower_segment: TimeSegment) => void;
    @ModuleDataImportAction
    public setsegment_number: (segment_number: number) => void;

    @ModuleDataImportAction
    public reinitStoreValues: () => void;

    @Prop({ default: null })
    public initial_selected_segment: string;

    @Prop({ default: false })
    public modal_show: boolean;

    //--- pour l'export
    private column_labels: { [field_name: string]: string } = {
        name: "name",
        description: "description",
        messages: "messages",
        computed_name: "computed_name",
        weight: "weight",
        theme_id_import: "theme_id_import",
        // document_id: "document_id",
        role_id_ranges: "role_id_ranges",
        id_import: "id_import",
    };
    private column_titles: string[] = Object.keys(this.column_labels);
    private modules_for_export: any[] = [];

    private modules: AnimationModuleVO[];
    private themes: AnimationThemeVO[];

    private accepted_types = ["string", "number"];
    //---

    public async mounted() {
        this.startLoading();

        this.reinitStoreValues();
        this.setsegment_type(TimeSegment.TYPE_YEAR);
        this.setsegment_offset(1);
        this.setlower_segment(TimeSegmentHandler.getCorrespondingTimeSegment(Dates.now(), TimeSegment.TYPE_YEAR));
        this.setsegment_number(1);

        await this.setExport();

        this.stopLoading();
    }

    public getUrlForModal(segment_date_index: string = null) {
        let url: string = this.route_path;

        // Si segment
        url += ((segment_date_index) ? ('/' + DataImportAdminVueModule.IMPORT_MODAL + '/' + segment_date_index) : '');

        return url;
    }

    get api_type_id_module(): string[] {
        return [AnimationImportModuleVO.API_TYPE_ID];
    }

    get route_path(): string {
        return AnimationImportModuleAdminVue.ROUTE_PATH_IMPORT;
    }

    //--- partie export
    private async setExport() {
        this.startLoading();

        const promises = [];
        promises.push((async () => {
            this.modules = await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>();
        })());
        promises.push((async () => {
            this.themes = await query(AnimationThemeVO.API_TYPE_ID).select_vos<AnimationThemeVO>();
        })());

        await all_promises(promises);

        await this.set_modules_for_export();

        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.get_export_params_for_xlsx);
        this.stopLoading();
    }


    private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {
        return new ExportDataToXLSXParamVO(
            "Export-Module-" + moment().utc(true) + ".xlsx",
            this.modules_for_export,
            this.column_titles,
            this.column_labels,
            AnimationModuleVO.API_TYPE_ID,
        );
    }


    private async set_modules_for_export(): Promise<AnimationImportModuleVO[]> {
        this.modules_for_export = [];

        for (const module of this.modules) {
            const data: AnimationImportModuleVO = new AnimationImportModuleVO();

            for (const property of this.column_titles) {
                data[property] = this.exportData(module[property]);
            }

            const associated_theme: AnimationThemeVO = this.themes.find((theme) => theme.id == module.theme_id);
            data.theme_id_import = this.exportData(associated_theme.id_import);

            const role_id_ranges: NumRange[] = module.role_id_ranges;
            const role_names: string[] = await this.getRoleNamesFromRange(role_id_ranges);
            data.role_id_ranges = this.exportData(role_names);

            this.modules_for_export.push(data);
        }

        return this.modules_for_export;
    }

    private exportData(value: any): any {
        if (this.accepted_types.includes(typeof value)) {
            return value;
        }
        if (value == null || value == undefined) {
            return undefined;
        }
        return JSON.stringify(value);
    }

    private async getRoleNamesFromRange(role_id_ranges: NumRange[]): Promise<string[]> {
        const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).filter_by_ids(role_id_ranges).select_vos<RoleVO>();
        const names: string[] = [];

        if (roles && roles.length > 0) {
            for (const role of roles) {
                names.push(role.translatable_name);
            }
        }
        return names;
    }
    //---
}