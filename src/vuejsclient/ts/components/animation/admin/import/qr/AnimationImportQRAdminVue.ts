import moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import AnimationImportQRVO from '../../../../../../../shared/modules/Animation/import/QR/vos/AnimationImportQRVO';
import DataImportAdminVueModule from '../../../../data_import/DataImportAdminVueModule';
import { ModuleDataImportAction } from '../../../../data_import/store/DataImportStore';
import VueComponentBase from '../../../../VueComponentBase';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../../../../shared/tools/TimeSegmentHandler';
import DataImportComponent from '../../../../data_import/component/DataImportComponent';
import AnimationQRVO from '../../../../../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationModuleVO from '../../../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AppVuexStoreManager from '../../../../../store/AppVuexStoreManager';
import ExportDataToXLSXParamVO from '../../../../../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import Dates from '../../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';

@Component({
    template: require('./AnimationImportQRAdminVue.pug'),
    components: {
        data_import_component: DataImportComponent,
    }
})
export default class AnimationImportQRAdminVue extends VueComponentBase {
    public static ROUTE_PATH_IMPORT: string = "/importQRAnimation";
    public static ROUTE_NAME_IMPORT: string = 'importQRAnimation';

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
        description: "description",
        reponses: "reponses",
        explicatif: "explicatif",
        // external_video: "external_video",
        name: "name",
        weight: "weight",
        // question_file_id: "question_file_id",
        // reponse_file_id: "reponse_file_id",
        module_id_import: "module_id_import",
    };
    private column_titles: string[] = Object.keys(this.column_labels);
    private qrs_for_export: any[] = [];

    private qrs: AnimationQRVO[];
    private modules: AnimationModuleVO[];

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

    get api_type_id_QR(): string[] {
        return [AnimationImportQRVO.API_TYPE_ID];
    }

    get route_path(): string {
        return AnimationImportQRAdminVue.ROUTE_PATH_IMPORT;
    }

    //--- partie export
    private async setExport() {
        this.startLoading();

        let promises = [];
        promises.push((async () => {
            this.qrs = await query(AnimationQRVO.API_TYPE_ID).select_vos<AnimationQRVO>();
        })());
        promises.push((async () => {
            this.modules = await query(AnimationModuleVO.API_TYPE_ID).select_vos<AnimationModuleVO>();
        })());

        await all_promises(promises);

        this.set_qrs_for_export();

        AppVuexStoreManager.getInstance().appVuexStore.dispatch('register_hook_export_data_to_XLSX', this.get_export_params_for_xlsx);
        this.stopLoading();
    }


    private get_export_params_for_xlsx(): ExportDataToXLSXParamVO {
        return new ExportDataToXLSXParamVO(
            "Export-QR-" + moment().utc(true) + ".xlsx",
            this.qrs_for_export,
            this.column_titles,
            this.column_labels,
            AnimationQRVO.API_TYPE_ID,
        );
    }


    private set_qrs_for_export(): AnimationImportQRVO[] {
        this.qrs_for_export = [];

        for (let qr of this.qrs) {
            let data: AnimationImportQRVO = new AnimationImportQRVO();

            for (let property of this.column_titles) {
                data[property] = this.exportData(qr[property]);
            }

            let associated_module = this.modules.find((module) => module.id == qr.module_id);
            data["module_id_import"] = this.exportData(associated_module.id_import);

            this.qrs_for_export.push(data);
        }

        return this.qrs_for_export;
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