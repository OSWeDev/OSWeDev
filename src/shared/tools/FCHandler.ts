import { EventObjectInput } from 'fullcalendar';
import { Duration, Moment } from 'moment';
import HourRange from '../modules/DataRender/vos/HourRange';
import RangeHandler from './RangeHandler';

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

    public setEventObjectInputStart(fcevent: EventObjectInput, date: Moment, hour: Duration): void {
        if ((fcevent == null) || (typeof fcevent == 'undefined')) {
            return;
        }
        if ((date == null) || (typeof date == 'undefined')) {
            return;
        }
        if ((hour == null) || (typeof hour == 'undefined')) {
            return;
        }
        fcevent.start = date.startOf('day').add(hour.asMilliseconds(), 'ms');
    }

    public setEventObjectInputEnd(fcevent: EventObjectInput, date: Moment, hour: Duration): void {
        if ((fcevent == null) || (typeof fcevent == 'undefined')) {
            return;
        }
        if ((date == null) || (typeof date == 'undefined')) {
            return;
        }
        if ((hour == null) || (typeof hour == 'undefined')) {
            return;
        }
        fcevent.end = date.startOf('day').add(hour.asMilliseconds(), 'ms');
    }

    public setEventObjectInputPeriodFromHourRange(fcevent: EventObjectInput, date: Moment, hour_range: HourRange, hour_segment_type: number): void {
        if ((hour_range == null) || (typeof hour_range == 'undefined')) {
            return;
        }

        this.setEventObjectInputStart(fcevent, date, RangeHandler.getInstance().getSegmentedMin(hour_range, hour_segment_type));
        this.setEventObjectInputEnd(fcevent, date, RangeHandler.getInstance().getSegmentedMax(hour_range, hour_segment_type));
    }
}