import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleDataRender from '../../../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../../../shared/modules/DataRender/vos/DataRendererVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../../../ts/modules/AjaxCache/AjaxCacheClientController';


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

        let segment_correspondant: TimeSegment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment().utc(true), this.time_segment_type);
        this.segment_start_date =
            moment(TimeSegmentHandler.getInstance().getPreviousTimeSegment(segment_correspondant).dateIndex).utc(true).toDate();
        this.segment_start_date = moment().utc(true).startOf('month').add(-1, 'month').toDate();
        this.segment_end_date = moment(segment_correspondant.dateIndex).utc(true).toDate();

        this.isLoading = false;
    }

    public async send(): Promise<boolean> {
        try {

            var formData = new FormData();
            formData.append('render_time_segments_json', JSON.stringify(TimeSegmentHandler.getInstance().getAllDataTimeSegments(moment(this.segment_start_date).utc(true), moment(this.segment_end_date).utc(true), this.time_segment_type)));

            let $ = await import(/* webpackChunkName: "jquery" */ 'jquery');
            await $.ajax({
                url: '/modules/ModuleDataRender/renderData/' + this.renderer_name,
                method: "POST",
                data: formData,
                contentType: false,
                processData: false,
                headers: { 'X-CSRF-Token': AjaxCacheClientController.getInstance().csrf_token }
            });
            this.snotify.success("Génération des données terminée !");
            return true;
        } catch (error) {
            this.snotify.error(error);
            ConsoleHandler.getInstance().error(error);
        }
        return false;
    }
}