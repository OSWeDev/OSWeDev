import moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import AnimationImportThemeVO from '../../../../../../../shared/modules/Animation/import/Theme/vos/AnimationImportThemeVO';
import DataImportAdminVueModule from '../../../../data_import/DataImportAdminVueModule';
import { ModuleDataImportAction } from '../../../../data_import/store/DataImportStore';
import VueComponentBase from '../../../../VueComponentBase';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../../../../shared/tools/TimeSegmentHandler';
import DataImportComponent from '../../../../data_import/component/DataImportComponent';
import AnimationThemeVO from '../../../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import AppVuexStoreManager from '../../../../../store/AppVuexStoreManager';
import ExportDataToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';


@Component({
    template: require('./AnimationImportThemeAdminVue.pug'),
    components: {
        data_import_component: DataImportComponent,
    }
})
export default class AnimationImportThemeAdminVue extends VueComponentBase {
    public static ROUTE_PATH_IMPORT: string = "/importThemeAnimation";
    public static ROUTE_NAME_IMPORT: string = 'importThemeAnimation';

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
    private themes: AnimationThemeVO[];
    private column_labels: { [field_name: string]: string } = {
        name: "name",
        description: "description",
        weight: "weight",
        id_import: "id_import"
    };
    private column_titles: string[] = Object.keys(this.column_labels);
    private themes_for_export: any[] = [];

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

    get api_type_id_theme(): string[] {
        return [AnimationImportThemeVO.API_TYPE_ID];
    }

    get route_path(): string {
        return AnimationImportThemeAdminVue.ROUTE_PATH_IMPORT;
    }

    //--- partie export
    private async setExport() {
        this.startLoading();
        this.themes = await ModuleDAO.getInstance().getVos(AnimationThemeVO.API_TYPE_ID);
        this.set_themes_for_export();

        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.get_export_params_for_xlsx);
        this.stopLoading();
    }


    private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {
        return new ExportDataToXLSXParamVO(
            "Export-Theme-" + moment().utc(true) + ".xlsx",
            this.themes_for_export,
            this.column_titles,
            this.column_labels,
            AnimationThemeVO.API_TYPE_ID,
        );
    }


    private set_themes_for_export(): AnimationImportThemeVO[] {
        this.themes_for_export = [];

        for (let theme of this.themes) {
            let data: AnimationImportThemeVO = new AnimationImportThemeVO();
            for (let property of this.column_titles) {
                data[property] = this.exportData(theme[property]);
            }
            this.themes_for_export.push(data);
        }

        return this.themes_for_export;
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
    //---
}