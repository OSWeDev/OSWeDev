import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import TimeSegment from '../../../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ConsoleHandler from '../../../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../../../VueComponentBase';
import './TstzFilterOptionsComponent.scss';

@Component({
    template: require('./TstzFilterOptionsComponent.pug'),
    components: {}
})
export default class TstzFilterOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private actual_additional_options: string;

    private segment_type_options: string[] = [
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_YEAR),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_MONTH),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_DAY),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_WEEK),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_ROLLING_YEAR_MONTH_START),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_HOUR),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_MINUTE),
        this.label('TstzFilterOptionsComponent.segment_types.' + TimeSegment.TYPE_SECOND),
    ];
    private tmp_segment_type: string = null;

    @Watch('actual_additional_options', { immediate: true })
    private onchange_actual_additional_options() {

        try {
            let options = this.actual_additional_options ? JSON.parse(this.actual_additional_options) : null;

            this.tmp_segment_type = this.segment_type_options[(options && options[0]) ? parseInt(options[0]) : 0];
            this.onchange_inputs();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_segment_type')
    private onchange_inputs() {

        let options = JSON.parse(this.actual_additional_options);
        let option_segment_type = this.segment_type_options[(options && options[0]) ? parseInt(options[0]) : 0];
        if ((!options) || (options[0] == null) || (option_segment_type != this.tmp_segment_type)) {
            options = [
                this.get_segment_type_from_selected_option(this.tmp_segment_type)
            ];
        }

        this.$emit('update_additional_options', JSON.stringify(options));
    }

    private get_segment_type_from_selected_option(selected_option: string): number {
        if (this.segment_type_options) {
            let res = this.segment_type_options.indexOf(selected_option);
            return res >= 0 ? res : null;
        }
    }
}