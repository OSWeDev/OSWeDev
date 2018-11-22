import * as $ from 'jquery';
import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDataRender from '../../../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../../../shared/modules/DataRender/vos/DataRendererVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import VueComponentBase from '../../../../ts/components/VueComponentBase';


@Component({
    template: require('./DataRendererAdminVueBase.pug'),
    components: {}
})
export default class DataRendererAdminVueBase extends VueComponentBase {

    @Prop()
    public renderer_name: string;

    @Prop()
    public time_segment_type: number;

    public dataRenderer: DataRendererVO;
    public segment_start_date: Date;
    public segment_end_date: Date;

    public async mounted() {

        this.isLoading = true;

        this.dataRenderer = await ModuleDataRender.getInstance().getDataRenderer(this.renderer_name);

        let segment_correspondant: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(), this.time_segment_type);
        this.segment_start_date =
            moment(TimeSegmentHandler.getInstance().getPreviousTimeSegment(segment_correspondant).dateIndex).toDate();
        this.segment_start_date = moment().startOf('month').add(-1, 'month').toDate();
        this.segment_end_date = moment(segment_correspondant.dateIndex).toDate();

        this.isLoading = false;
    }

    public async send(): Promise<boolean> {
        try {

            var formData = new FormData();
            formData.append('render_time_segments_json', JSON.stringify(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment(this.segment_start_date), moment(this.segment_end_date), this.time_segment_type)));

            await $.ajax({
                url: '/modules/ModuleDataRender/renderData/' + this.renderer_name,
                method: "POST",
                data: formData,
                contentType: false,
                processData: false,
            });
            this.snotify.success("Génération des données terminée !");
            return true;
        } catch (error) {
            this.snotify.error(error);
            console.error(error);
        }
        return false;
    }
}