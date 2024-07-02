
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleDataRender from '../../../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../../../shared/modules/DataRender/vos/DataRendererVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
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

        const segment_correspondant: TimeSegment = TimeSegmentHandler.getCorrespondingTimeSegment(Dates.now(), this.time_segment_type);
        // ????
        // this.segment_start_date =
        //     new Date(TimeSegmentHandler.getPreviousTimeSegment(segment_correspondant).index * 1000);
        this.segment_start_date = new Date(Dates.add(Dates.startOf(Dates.now(), TimeSegment.TYPE_MONTH), -1, TimeSegment.TYPE_MONTH) * 1000);
        this.segment_end_date = new Date(segment_correspondant.index * 1000);

        this.isLoading = false;
    }

    public async send(): Promise<boolean> {
        try {

            const formData = new FormData();
            formData.append('render_time_segments_json', JSON.stringify(TimeSegmentHandler.getAllDataTimeSegments(this.segment_start_date.getTime() / 1000, this.segment_end_date.getTime() / 1000, this.time_segment_type)));

            const $ = await import('jquery');
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
            ConsoleHandler.error(error);
        }
        return false;
    }
}