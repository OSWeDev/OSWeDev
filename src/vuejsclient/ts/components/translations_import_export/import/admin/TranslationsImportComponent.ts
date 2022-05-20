import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ImportTranslation from '../../../../../../shared/modules/Translation/import/vos/ImportTranslation';
import TimeSegmentHandler from '../../../../../../shared/tools/TimeSegmentHandler';
import DataImportAdminVueModule from '../../../data_import/DataImportAdminVueModule';
import NoSegmentDataImportComponent from '../../../data_import/nosegment_component/NoSegmentDataImportComponent';
import { ModuleDataImportAction } from '../../../data_import/store/DataImportStore';
import VueComponentBase from '../../../VueComponentBase';
import TranslationsImportOverviewComponent from './overview/TranslationsImportOverviewComponent';
import TranslationsImportParamsComponent from './params/TranslationsImportParamsComponent';




@Component({
    template: require('./TranslationsImportComponent.pug'),
    components: {
        data_import_component: NoSegmentDataImportComponent
    }
})
export default class TranslationsImportComponent extends VueComponentBase {

    @ModuleDataImportAction
    public reinitStoreValues: () => void;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public params: string;

    private api_type_ids: string[] = [ImportTranslation.API_TYPE_ID];
    private route_path: string = "/import/translations";

    private overview_component = TranslationsImportOverviewComponent;
    private param_component = TranslationsImportParamsComponent;

    public mounted() {
        this.startLoading();

        this.reinitStoreValues();

        this.stopLoading();
    }
}