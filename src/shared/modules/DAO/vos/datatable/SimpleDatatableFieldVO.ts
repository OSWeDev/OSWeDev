

import moment = require('moment');
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import HourHandler from '../../../../../shared/tools/HourHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { amountFilter, hourFilter, percentFilter } from '../../../../tools/Filters';
import MatroidIndexHandler from '../../../../tools/MatroidIndexHandler';
import RangeHandler from '../../../../tools/RangeHandler';
import Dates from '../../../FormatDatesNombres/Dates/Dates';
import DatatableField from './DatatableField';

export default class SimpleDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "simple_dtf";

    public static createNew(datatable_field_uid: string): SimpleDatatableFieldVO<any, any> {

        let res = new SimpleDatatableFieldVO();
        res.init(SimpleDatatableFieldVO.API_TYPE_ID, DatatableField.SIMPLE_FIELD_TYPE, datatable_field_uid);
        return res;
    }

    public static defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string): any {
        if (this.computed_value && this.computed_value[datatable_field_uid]) {
            return this.computed_value[datatable_field_uid](field_value, moduleTableField, vo, datatable_field_uid);
        }
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {
                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_prct:
                    return percentFilter.read(field_value, 2);

                case ModuleTableField.FIELD_TYPE_amount:
                    return amountFilter.read(field_value);

                case ModuleTableField.FIELD_TYPE_translatable_text:
                    return LocaleManager.getInstance().label(field_value);

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return hourFilter.read(field_value);

                case ModuleTableField.FIELD_TYPE_enum:
                    return LocaleManager.getInstance().t(moduleTableField.enum_values[field_value]);

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:

                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment.unix(this.getMomentDateFieldInclusif(field_value, moduleTableField, true)).utc());

                case ModuleTableField.FIELD_TYPE_month:
                    return Dates.format(field_value, 'MMM YYYY');

                case ModuleTableField.FIELD_TYPE_daterange:

                    // On stocke au format day - day
                    if (!field_value) {
                        return field_value;
                    }

                    let daterange_array = null;
                    if (moduleTableField.field_type == ModuleTableField.FIELD_TYPE_daterange) {
                        daterange_array = [field_value];
                    } else {
                        daterange_array = field_value;
                    }

                    let res: string = "";
                    for (let i in daterange_array) {
                        let daterange = daterange_array[i];

                        let parts: string[] = daterange.replace(/[\(\)\[\]]/g, '').split(',');
                        if ((!parts) || (parts.length <= 0)) {
                            continue;
                        }

                        res += (res != "") ? ", " : "";
                        if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(parts[0].trim()).utc(true));
                        }
                        res += '-';
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment.unix(this.getMomentDateFieldInclusif(moment(parts[1].trim()).utc(true).unix(), moduleTableField, true)).utc());
                        }
                    }

                    return res;

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_tstzranges = "";

                    for (let i in field_value) {
                        let tstzrange: TSRange = field_value[i] as TSRange;

                        res_tstzranges += (res_tstzranges == "") ? '' : ' + ';

                        res_tstzranges += tstzrange.min_inclusiv ? '[' : '(';
                        res_tstzranges += Dates.format(tstzrange.min, 'DD/MM/Y HH:mm');
                        res_tstzranges += ',';
                        res_tstzranges += Dates.format(tstzrange.max, 'DD/MM/Y HH:mm');
                        res_tstzranges += tstzrange.max_inclusiv ? ']' : ')';
                    }

                    return res_tstzranges;

                case ModuleTableField.FIELD_TYPE_hourrange:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_hourrange = "";

                    let hourrange_: HourRange = field_value as HourRange;

                    res_hourrange += (res_hourrange == "") ? '' : ' + ';

                    res_hourrange += hourrange_.min_inclusiv ? '[' : '(';
                    res_hourrange += HourHandler.getInstance().formatHourForIHM(hourrange_.min, moduleTableField.segmentation_type);
                    res_hourrange += ',';
                    res_hourrange += HourHandler.getInstance().formatHourForIHM(hourrange_.max, moduleTableField.segmentation_type);
                    res_hourrange += hourrange_.max_inclusiv ? ']' : ')';

                    return res_hourrange;

                case ModuleTableField.FIELD_TYPE_hour:
                    return HourHandler.getInstance().formatHourForIHM(field_value, moduleTableField.segmentation_type);

                case ModuleTableField.FIELD_TYPE_hourrange_array:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_hourranges = "";

                    for (let i in field_value) {
                        let hourrange: HourRange = field_value[i] as HourRange;

                        res_hourranges += (res_hourranges == "") ? '' : ' + ';

                        res_hourranges += hourrange.min_inclusiv ? '[' : '(';
                        res_hourranges += HourHandler.getInstance().formatHourForIHM(hourrange.min, moduleTableField.segmentation_type);
                        res_hourranges += ',';
                        res_hourranges += HourHandler.getInstance().formatHourForIHM(hourrange.max, moduleTableField.segmentation_type);
                        res_hourranges += hourrange.max_inclusiv ? ']' : ')';
                    }

                    return res_hourranges;

                case ModuleTableField.FIELD_TYPE_numrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_numranges = "";

                    for (let i in field_value) {
                        let numrange: NumRange = field_value[i] as NumRange;

                        res_numranges += (res_numranges == "") ? '' : ' + ';

                        res_numranges += numrange.min_inclusiv ? '[' : '(';
                        res_numranges += numrange.min;
                        res_numranges += ',';
                        res_numranges += numrange.max;
                        res_numranges += numrange.max_inclusiv ? ']' : ')';
                    }

                    return res_numranges;

                case ModuleTableField.FIELD_TYPE_tsrange:
                    let res_tsrange: string[] = [];

                    let none: boolean = true;

                    let min_period: number = RangeHandler.getSegmentedMin(field_value, TimeSegment.TYPE_DAY, 0, moduleTableField.return_min_value);
                    if (min_period) {
                        res_tsrange.push(Dates.format_segment(min_period, moduleTableField.segmentation_type, moduleTableField.format_localized_time));
                        none = false;
                    } else {
                        res_tsrange.push('');
                    }

                    let max_period: number = RangeHandler.getSegmentedMax(field_value, TimeSegment.TYPE_DAY, 0, moduleTableField.return_max_value);

                    if (max_period) {
                        // Si mon max est différent du min, j'ajoute, sinon ça ne sert à rien car ça affiche en double
                        if (max_period != min_period) {
                            res_tsrange.push(Dates.format_segment(max_period, moduleTableField.segmentation_type, moduleTableField.format_localized_time));
                            none = false;
                        }
                    } else {
                        res_tsrange.push('');
                    }

                    if (!none) {
                        return res_tsrange.join(' - ');
                    }

                    // none still active field_value may have another format
                    const rgx = /(?<=[\[?\(])(\d{10})\,(\d{10})(?=[\]?\)])/; // the actual date_range format may be e.g. "[1577836800,1580515200)"
                    const isStringDateRangeFormat = rgx.test(field_value);

                    if (isStringDateRangeFormat) {
                        const new_field_value = RangeHandler.parseRangeBDD(TSRange.RANGE_TYPE, field_value, (moduleTableField.segmentation_type ?? TimeSegment.TYPE_SECOND));
                        return SimpleDatatableFieldVO.defaultDataToReadIHM(new_field_value, moduleTableField, vo, datatable_field_uid);
                    }

                    return none ? '∞' : res_tsrange.join(' - ');

                case ModuleTableField.FIELD_TYPE_numrange:
                    let res_numrange: string[] = [];

                    let none_number: boolean = true;

                    let min_number: number = RangeHandler.getSegmentedMin(field_value, null, 0, moduleTableField.return_min_value);
                    if (min_number) {
                        res_numrange.push(min_number.toFixed(0));
                        none_number = false;

                    } else {
                        res_numrange.push('');
                    }

                    let max_number: number = RangeHandler.getSegmentedMax(field_value, null, 0, moduleTableField.return_max_value);

                    if (max_number) {
                        if (max_number.toFixed(0) != min_number.toFixed(0)) {
                            res_numrange.push(max_number.toFixed(0));
                            none_number = false;
                        }
                    } else {
                        res_numrange.push('');
                    }

                    return none_number ? '∞' : res_numrange.join(' - ');

                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_string_array:
                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                case ModuleTableField.FIELD_TYPE_geopoint:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_tstz:
                    let date = this.getMomentDateFieldInclusif(field_value, moduleTableField, true);
                    return Dates.format_segment(date, moduleTableField.segmentation_type, moduleTableField.format_localized_time);

                case ModuleTableField.FIELD_TYPE_tstz_array:
                    let res_tstz_array = '';

                    for (let i in field_value) {
                        let fv = field_value[i];

                        if (res_tstz_array != '') {
                            res_tstz_array += ', ';
                        }

                        let date_fv = this.getMomentDateFieldInclusif(fv, moduleTableField, true);
                        res_tstz_array += Dates.format_segment(date_fv, moduleTableField.segmentation_type, moduleTableField.format_localized_time);
                    }
                    return res_tstz_array;

                case ModuleTableField.FIELD_TYPE_textarea:
                default:

                    for (let j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (moduleTableField.field_type == tableFieldTypeController.name) {
                            return tableFieldTypeController.defaultDataToReadIHM(field_value, moduleTableField, vo);
                        }
                    }

                    return field_value.toString();
            }
        } catch (error) {
            // ConsoleHandler.error(error);
            return field_value;
        }
    }

    public static defaultDataToUpdateIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string): any {
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {

                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_translatable_text:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_enum:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_boolean:
                    if (moduleTableField.field_required) {
                        return (!field_value) ? false : true;
                    }
                    return field_value;

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return DateHandler.getInstance().formatDayForVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true).unix(), moduleTableField, true));
                case ModuleTableField.FIELD_TYPE_month:
                    return DateHandler.getInstance().formatMonthFromVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true).unix(), moduleTableField, true));

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                case ModuleTableField.FIELD_TYPE_hourrange:
                case ModuleTableField.FIELD_TYPE_numrange:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                case ModuleTableField.FIELD_TYPE_tstz:
                case ModuleTableField.FIELD_TYPE_tsrange:
                    return field_value;

                default:
                    return SimpleDatatableFieldVO.defaultDataToReadIHM(field_value, moduleTableField, vo, datatable_field_uid);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return field_value;
        }
    }

    public static defaultReadIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((value === null) || (typeof value == "undefined")) {
            return value;
        }

        try {

            switch (moduleTableField.field_type) {
                case ModuleTableField.FIELD_TYPE_boolean:
                    if ((value === true) || (value === "true")) {
                        return true;
                    }
                    return false;

                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                    return value;

                case ModuleTableField.FIELD_TYPE_prct:
                    return percentFilter.write(value);

                case ModuleTableField.FIELD_TYPE_amount:
                    return amountFilter.write(value);

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return hourFilter.write(value);

                case ModuleTableField.FIELD_TYPE_float:
                case ModuleTableField.FIELD_TYPE_decimal_full_precision:
                    let efloat = parseFloat(value);
                    return (isNaN(efloat)) ? null : efloat;
                case ModuleTableField.FIELD_TYPE_int:
                    let eint = parseInt(value);
                    return (isNaN(eint)) ? null : eint;

                case ModuleTableField.FIELD_TYPE_enum:
                    for (let i in moduleTableField.enum_values) {
                        if (LocaleManager.getInstance().i18n.t(moduleTableField.enum_values[i]) == value) {
                            return i;
                        }
                    }
                    return null;

                case ModuleTableField.FIELD_TYPE_daterange:
                    // On stocke au format "day day"
                    if (!value) {
                        return value;
                    }

                    let parts: string[] = value.split('-');
                    if ((!parts) || (parts.length <= 0)) {
                        return value;
                    }

                    let res: string = "[";
                    if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()).unix());
                    }
                    res += ',';
                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()).unix(), moduleTableField, false));
                    }
                    res += ')';

                    return res;

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return value ? DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(moment(value).utc(true).unix(), moduleTableField, false)) : null;
                case ModuleTableField.FIELD_TYPE_month:
                    return value ? DateHandler.getInstance().formatDayForSQL(moment(value).utc(true).startOf('month').unix()) : null;

                case ModuleTableField.FIELD_TYPE_float_array:
                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_string_array:
                    // ATTENTION - INTERDITION DE METTRE UNE VIRGULE DANS UN CHAMP DE TYPE ARRAY SINON CA FAIT X VALEURS
                    let values: any[] = [];

                    for (let j in value) {
                        if (value[j]) {
                            values.push(value[j]);
                        }
                    }

                    if (!values || !values.length) {
                        return null;
                    }

                    return '{' + values + '}';

                case ModuleTableField.FIELD_TYPE_html_array:

                case ModuleTableField.FIELD_TYPE_tstz:
                    switch (moduleTableField.segmentation_type) {
                        case TimeSegment.TYPE_MONTH:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_MONTH) : null;
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_MONTH), moduleTableField, false) : null;
                        case TimeSegment.TYPE_WEEK:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_WEEK), moduleTableField, false) : null;
                        case TimeSegment.TYPE_YEAR:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_YEAR) : null;
                        case TimeSegment.TYPE_DAY:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_DAY), moduleTableField, false) : null;
                        default:
                            return value ? this.getMomentDateFieldInclusif(value, moduleTableField, false) : null;
                    }

                case ModuleTableField.FIELD_TYPE_tstz_array:
                    let res_tstz_array = [];

                    for (let i in value) {
                        let v = value[i];

                        switch (moduleTableField.segmentation_type) {
                            case TimeSegment.TYPE_MONTH:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_MONTH) : null);
                            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_DAY), moduleTableField, false) : null);
                            case TimeSegment.TYPE_WEEK:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_WEEK), moduleTableField, false) : null);
                            case TimeSegment.TYPE_YEAR:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_YEAR) : null);
                            case TimeSegment.TYPE_DAY:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_DAY), moduleTableField, false) : null);
                            default:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(v, moduleTableField, false) : null);
                        }
                    }

                    return res_tstz_array;

                case ModuleTableField.FIELD_TYPE_textarea:
                default:

                    for (let j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (moduleTableField.field_type == tableFieldTypeController.name) {
                            return tableFieldTypeController.defaultReadIHMToData(value, moduleTableField, vo);
                        }
                    }

                    return value;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return value;
        }
    }

    public static defaultUpdateIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((value === null) || (typeof value == "undefined")) {
            return value;
        }

        try {

            switch (moduleTableField.field_type) {

                case ModuleTableField.FIELD_TYPE_plain_vo_obj:
                    return value;

                case ModuleTableField.FIELD_TYPE_enum:
                    return value;

                default:
                    return SimpleDatatableFieldVO.defaultReadIHMToData(value, moduleTableField, vo);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return value;
        }
    }

    private static getMomentDateFieldInclusif(momentSrc: number, moduleTableField: ModuleTableField<any>, is_data_to_ihm: boolean): number {
        let date = momentSrc;
        if (moduleTableField.is_inclusive_data != moduleTableField.is_inclusive_ihm) {
            if (moduleTableField.is_inclusive_data) {
                date = Dates.add(date, is_data_to_ihm ? 1 : -1, moduleTableField.segmentation_type);
            } else {
                date = Dates.add(date, is_data_to_ihm ? -1 : 1, moduleTableField.segmentation_type);
            }
        }

        return date;
    }

    get max_values(): number {

        return this.moduleTableField.max_values;
    }

    get min_values(): number {

        return this.moduleTableField.min_values;
    }

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableFieldVO.defaultDataToReadIHM(e, this.moduleTableField, vo, this.datatable_field_uid) as any;
    }
    public dataToUpdateIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableFieldVO.defaultDataToUpdateIHM(e, this.moduleTableField, vo, this.datatable_field_uid) as any;
    }
    public dataToCreateIHM(e: T, vo: IDistantVOBase): U {
        return this.dataToUpdateIHM(e, vo);
    }

    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return SimpleDatatableFieldVO.defaultReadIHMToData(e, this.moduleTableField, vo) as any;
    }
    public UpdateIHMToData(e: U, vo: IDistantVOBase): T {
        return SimpleDatatableFieldVO.defaultUpdateIHMToData(e, this.moduleTableField, vo) as any;
    }
    public CreateIHMToData(e: U, vo: IDistantVOBase): T {
        return this.UpdateIHMToData(e, vo);
    }

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        let e = this.moduleTableField.field_label.code_text;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    public enumIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if ((typeof id === 'undefined') || (id === null)) {
            return null;
        }

        return LocaleManager.getInstance().i18n.t(this.moduleTableField.enum_values[id]);
    }

    public enumIdToHumanReadableImage: (id: number) => string = (id: number) => {
        let res: string = "";

        if ((typeof id === 'undefined') || (id === null)) {
            return null;
        }

        return this.moduleTableField.enum_image_values ? this.moduleTableField.enum_image_values[id] : null;
    }

    public getValidationTextCodeBase(): string {
        return this.moduleTableField.getValidationTextCodeBase();
    }

    public dataToHumanReadableField(e: IDistantVOBase): U {
        let res = this.dataToReadIHM(e[this.datatable_field_uid], e);

        if ((this.type == SimpleDatatableFieldVO.SIMPLE_FIELD_TYPE) && (this.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean)) {

            // FIXME TODO si on est sur un boolean on voudrait voir idéalement OUI/NON et pas true /false mais ça dépend de la langue donc c'est pas si simple...
            return res;
        }

        if (res == null) {
            return '' as any as U;
        }

        return res;
    }
}