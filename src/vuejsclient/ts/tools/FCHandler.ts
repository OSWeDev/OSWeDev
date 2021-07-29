import { EventObjectInput } from 'fullcalendar';
import HourRange from '../../../shared/modules/DataRender/vos/HourRange';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import RangeHandler from '../../../shared/tools/RangeHandler';

/**
 * Tools for fullcalendar usage
 */
export default class FCHandler {

    public static getInstance(): FCHandler {
        if (!FCHandler.instance) {
            FCHandler.instance = new FCHandler();
        }
        return FCHandler.instance;
    }

    private static instance: FCHandler = null;

    private constructor() {
    }

    public setEventObjectInputStart(fcevent: EventObjectInput, date: number, hour: number): void {
        if ((fcevent == null) || (typeof fcevent == 'undefined')) {
            return;
        }
        if ((date == null) || (typeof date == 'undefined')) {
            return;
        }
        if ((hour == null) || (typeof hour == 'undefined')) {
            return;
        }
        fcevent.start = Dates.startOf(date, TimeSegment.TYPE_DAY) + hour;
    }

    public setEventObjectInputEnd(fcevent: EventObjectInput, date: number, hour: number): void {
        if ((fcevent == null) || (typeof fcevent == 'undefined')) {
            return;
        }
        if ((date == null) || (typeof date == 'undefined')) {
            return;
        }
        if ((hour == null) || (typeof hour == 'undefined')) {
            return;
        }
        fcevent.end = Dates.startOf(date, TimeSegment.TYPE_DAY) + hour;
    }

    public setEventObjectInputPeriodFromHourRange(fcevent: EventObjectInput, date: number, hour_range: HourRange, hour_segment_type: number): void {
        if ((hour_range == null) || (typeof hour_range == 'undefined')) {
            return;
        }

        this.setEventObjectInputStart(fcevent, date, RangeHandler.getInstance().getSegmentedMin(hour_range, hour_segment_type));
        this.setEventObjectInputEnd(fcevent, date, RangeHandler.getInstance().getSegmentedMax(hour_range, hour_segment_type));
    }
}