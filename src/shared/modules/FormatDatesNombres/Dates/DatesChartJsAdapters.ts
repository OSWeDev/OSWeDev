'use strict';

import moment from 'moment';
import { _adapters } from 'chart.js';

const FORMATS = {
    datetime: 'MMM D, YYYY, h:mm:ss a',
    millisecond: 'h:mm:ss.SSS a',
    second: 'h:mm:ss a',
    minute: 'h:mm a',
    hour: 'hA',
    day: 'MMM D',
    week: 'll',
    month: 'MMM YYYY',
    quarter: '[Q]Q - YYYY',
    year: 'YYYY'
};

export default class DatesChartJsAdapters {

    public static add_adapters() {
        _adapters._date.override({
            // _id: 'moment', // DEBUG ONLY

            formats: function () {
                return FORMATS;
            },

            parse: function (value: any, format: string) {
                if (typeof value === 'string' && typeof format === 'string') {
                    value = moment(value, format);
                } else if (!(value instanceof moment)) {
                    value = moment(value);
                }
                return value.isValid() ? value.valueOf() : null;
            },

            format: function (time: number, format: string) {
                return moment(time).format(format);
            },

            add: function (time: number, amount: any, unit: string) {
                return moment(time).add(amount, unit).valueOf();
            },

            diff: function (max, min, unit) {
                return moment(max).diff(moment(min), unit);
            },

            startOf: function (time: any, unit: string, weekday: any) {
                time = moment(time);

                if (unit === 'isoWeek') {
                    weekday = Math.trunc(Math.min(Math.max(0, weekday), 6));
                    return time.isoWeekday(weekday).startOf('day').valueOf();
                }

                return time.startOf(unit).valueOf();
            },

            endOf: function (time, unit) {
                return moment(time).endOf(unit).valueOf();
            }
        });
    }
}