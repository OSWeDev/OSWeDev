import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import HourSegment from '../../../../../shared/modules/DataRender/vos/HourSegment';
import Durations from '../../../../../shared/modules/FormatDatesNombres/Dates/Durations';
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

            case HourSegment.TYPE_SECOND:
                return Durations.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_HHmmss);
            case HourSegment.TYPE_MINUTE:
                return Durations.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_HHmm);
            case HourSegment.TYPE_HOUR:
                return Durations.format(RangeHandler.getInstance().getSegmentedMin(this.range), ModuleFormatDatesNombres.FORMAT_HH);

            default: return null;
        }
    }

    get segmented_max(): string {

        if (!this.range) {
            return null;
        }

        switch (this.range.segment_type) {

            case HourSegment.TYPE_SECOND:
                return Durations.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_HHmmss);
            case HourSegment.TYPE_MINUTE:
                return Durations.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_HHmm);
            case HourSegment.TYPE_HOUR:
                return Durations.format(RangeHandler.getInstance().getSegmentedMax(this.range), ModuleFormatDatesNombres.FORMAT_HH);

            default: return null;
        }
    }

    get is_MAX_RANGE(): boolean {
        if (!this.range) {
            return false;
        }

        return (RangeHandler.getInstance().getSegmentedMin(this.range) == RangeHandler.MIN_HOUR) && (RangeHandler.getInstance().getSegmentedMax(this.range) == RangeHandler.MAX_HOUR);
    }
}