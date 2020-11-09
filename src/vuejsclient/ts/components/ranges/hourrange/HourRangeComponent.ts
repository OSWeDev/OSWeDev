import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import HourSegment from '../../../../../shared/modules/DataRender/vos/HourSegment';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import VueComponentBase from '../../VueComponentBase';
import '../RangeComponent.scss';

@Component({
    template: require('./HourRangeComponent.pug'),
    components: {}
})
export default class HourRangeComponent extends VueComponentBase {

    @Prop({ default: null })
    private range: HourRange;

    get segmented_min(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case HourSegment.TYPE_MS:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmmss_ms(RangeHandler.getInstance().getSegmentedMin(this.range));
            case HourSegment.TYPE_SECOND:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmmss(RangeHandler.getInstance().getSegmentedMin(this.range));
            case HourSegment.TYPE_MINUTE:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmm(RangeHandler.getInstance().getSegmentedMin(this.range));
            case HourSegment.TYPE_HOUR:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HH(RangeHandler.getInstance().getSegmentedMin(this.range));

            default: return null;
        }
    }

    get segmented_max(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case HourSegment.TYPE_MS:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmmss_ms(RangeHandler.getInstance().getSegmentedMax(this.range));
            case HourSegment.TYPE_SECOND:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmmss(RangeHandler.getInstance().getSegmentedMax(this.range));
            case HourSegment.TYPE_MINUTE:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HHmm(RangeHandler.getInstance().getSegmentedMax(this.range));
            case HourSegment.TYPE_HOUR:
                return ModuleFormatDatesNombres.getInstance().formatDuration_to_HH(RangeHandler.getInstance().getSegmentedMax(this.range));

            default: return null;
        }
    }
}