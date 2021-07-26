import * as moment from 'moment';
import { Moment } from 'moment';
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import HourHandler from '../../../../../shared/tools/HourHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { amountFilter, hourFilter, percentFilter } from '../../../../tools/Filters';
import DatatableField from './DatatableField';

export default class SimpleDatatableField<T, U> extends DatatableField<T, U> {

    public static defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string): any {
        if (this.computed_value && this.computed_value[datatable_field_uid]) {
            return this.computed_value[datatable_field_uid](field_value, moduleTableField, vo, datatable_field_uid);
        }
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {
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
                    return LocaleManager.getInstance().i18n.t(moduleTableField.enum_values[field_value]);

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:

                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(this.getMomentDateFieldInclusif(moment(field_value).utc(true), moduleTableField, true));

                case ModuleTableField.FIELD_TYPE_month:
                    return moment(field_value).utc(true).format('MMM YYYY');

                case ModuleTableField.FIELD_TYPE_timestamp:
                    switch (moduleTableField.segmentation_type) {
                        case TimeSegment.TYPE_YEAR:
                        case TimeSegment.TYPE_MONTH:
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                        case TimeSegment.TYPE_WEEK:
                        case TimeSegment.TYPE_DAY:
                            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(field_value).utc(true));
                        default:
                            return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(field_value).utc(true)) + ' ' + moment(field_value).utc(true).format('HH:mm:ss');
                    }

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
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(this.getMomentDateFieldInclusif(moment(parts[1].trim()).utc(true), moduleTableField, true));
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
                        res_tstzranges += tstzrange.min.format('DD/MM/Y HH:mm');
                        res_tstzranges += ',';
                        res_tstzranges += tstzrange.max.format('DD/MM/Y HH:mm');
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

                case ModuleTableField.FIELD_TYPE_numrange:
                case ModuleTableField.FIELD_TYPE_tsrange:
                case ModuleTableField.FIELD_TYPE_int_array:
                case ModuleTableField.FIELD_TYPE_string_array:
                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                case ModuleTableField.FIELD_TYPE_geopoint:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_tstz:
                    switch (moduleTableField.segmentation_type) {
                        case TimeSegment.TYPE_MONTH:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('month').utc(true).format('Y-MM-DD');
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('day').utc(true).format('Y-MM-DD');
                        case TimeSegment.TYPE_WEEK:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('isoWeek').utc(true).format('Y-MM-DD');
                        case TimeSegment.TYPE_YEAR:
                            return field_value.year();
                        case TimeSegment.TYPE_DAY:
                        default:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).utc(true).format('Y-MM-DD');
                    }

                case ModuleTableField.FIELD_TYPE_tstz_array:
                    let res_tstz_array = '';

                    for (let i in field_value) {
                        let fv = field_value[i];

                        if (res_tstz_array != '') {
                            res_tstz_array += ', ';
                        }

                        switch (moduleTableField.segmentation_type) {
                            case TimeSegment.TYPE_MONTH:
                                res_tstz_array += this.getMomentDateFieldInclusif(fv, moduleTableField, true).startOf('month').utc(true).format('Y-MM-DD');
                            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                                res_tstz_array += this.getMomentDateFieldInclusif(fv, moduleTableField, true).startOf('day').utc(true).format('Y-MM-DD');
                            case TimeSegment.TYPE_WEEK:
                                res_tstz_array += this.getMomentDateFieldInclusif(fv, moduleTableField, true).startOf('isoWeek').utc(true).format('Y-MM-DD');
                            case TimeSegment.TYPE_YEAR:
                                res_tstz_array += fv.year();
                            case TimeSegment.TYPE_DAY:
                            default:
                                res_tstz_array += this.getMomentDateFieldInclusif(fv, moduleTableField, true).utc(true).format('Y-MM-DD');
                        }
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
            // ConsoleHandler.getInstance().error(error);
            return field_value;
        }
    }

    public static defaultDataToUpdateIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase, datatable_field_uid: string): any {
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {

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
                    return DateHandler.getInstance().formatDayForVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true), moduleTableField, true));
                case ModuleTableField.FIELD_TYPE_month:
                    return DateHandler.getInstance().formatMonthFromVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true), moduleTableField, true));

                case ModuleTableField.FIELD_TYPE_tstzrange_array:
                case ModuleTableField.FIELD_TYPE_hourrange:
                case ModuleTableField.FIELD_TYPE_numrange:
                case ModuleTableField.FIELD_TYPE_isoweekdays:
                case ModuleTableField.FIELD_TYPE_hourrange_array:
                case ModuleTableField.FIELD_TYPE_refrange_array:
                case ModuleTableField.FIELD_TYPE_tstz_array:
                case ModuleTableField.FIELD_TYPE_tstz:
                    return field_value;

                default:
                    return SimpleDatatableField.defaultDataToReadIHM(field_value, moduleTableField, vo, datatable_field_uid);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
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

                case ModuleTableField.FIELD_TYPE_prct:
                    return percentFilter.write(value);

                case ModuleTableField.FIELD_TYPE_amount:
                    return amountFilter.write(value);

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return hourFilter.write(value);

                case ModuleTableField.FIELD_TYPE_float:
                    return parseFloat(value);
                case ModuleTableField.FIELD_TYPE_int:
                    return parseInt(value);

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
                        res += DateHandler.getInstance().formatDayForSQL(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()));
                    }
                    res += ',';
                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()), moduleTableField, false));
                    }
                    res += ')';

                    return res;

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return value ? DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(moment(value).utc(true), moduleTableField, false)) : null;
                case ModuleTableField.FIELD_TYPE_month:
                    return value ? DateHandler.getInstance().formatDayForSQL(moment(value).utc(true).startOf('month')) : null;

                case ModuleTableField.FIELD_TYPE_int_array:
                    return '{' + value.join() + '}';

                case ModuleTableField.FIELD_TYPE_string_array:
                    return '{' + value.join() + '}';

                case ModuleTableField.FIELD_TYPE_html_array:
                    return '{' + value.join() + '}';

                case ModuleTableField.FIELD_TYPE_tstz:
                    switch (moduleTableField.segmentation_type) {
                        case TimeSegment.TYPE_MONTH:
                            return value ? moment(value).startOf('month').utc(true) : null;
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                            return value ? this.getMomentDateFieldInclusif(moment(value).startOf('day').utc(true), moduleTableField, false) : null;
                        case TimeSegment.TYPE_WEEK:
                            return value ? this.getMomentDateFieldInclusif(moment(value).startOf('isoWeek').utc(true), moduleTableField, false) : null;
                        case TimeSegment.TYPE_YEAR:
                            return moment().year(parseInt(value)).startOf('year').utc(true);
                        case TimeSegment.TYPE_DAY:
                            return value ? this.getMomentDateFieldInclusif(moment(value).startOf('day').utc(true), moduleTableField, false) : null;
                        default:
                            return value ? this.getMomentDateFieldInclusif(moment(value).utc(true), moduleTableField, false) : null;
                    }

                case ModuleTableField.FIELD_TYPE_tstz_array:
                    let res_tstz_array = [];

                    for (let i in value) {
                        let v = value[i];

                        switch (moduleTableField.segmentation_type) {
                            case TimeSegment.TYPE_MONTH:
                                res_tstz_array.push(v ? moment(v).startOf('month').utc(true) : null);
                            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(moment(v).startOf('day').utc(true), moduleTableField, false) : null);
                            case TimeSegment.TYPE_WEEK:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(moment(v).startOf('isoWeek').utc(true), moduleTableField, false) : null);
                            case TimeSegment.TYPE_YEAR:
                                res_tstz_array.push(moment().year(parseInt(v)).startOf('year').utc(true));
                            case TimeSegment.TYPE_DAY:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(moment(v).startOf('day').utc(true), moduleTableField, false) : null);
                            default:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(moment(v).utc(true), moduleTableField, false) : null);
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
            ConsoleHandler.getInstance().error(error);
            return value;
        }
    }

    public static defaultUpdateIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((value === null) || (typeof value == "undefined")) {
            return value;
        }

        try {

            switch (moduleTableField.field_type) {

                case ModuleTableField.FIELD_TYPE_enum:
                    return value;

                default:
                    return SimpleDatatableField.defaultReadIHMToData(value, moduleTableField, vo);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return value;
        }
    }

    private static getMomentDateFieldInclusif(momentSrc: Moment, moduleTableField: ModuleTableField<any>, is_data_to_ihm: boolean): Moment {
        let date = moment(momentSrc).utc(true);
        if (moduleTableField.is_inclusive_data != moduleTableField.is_inclusive_ihm) {
            if (moduleTableField.is_inclusive_data) {

                switch (moduleTableField.segmentation_type) {
                    case TimeSegment.TYPE_HOUR:
                        date.add(is_data_to_ihm ? 1 : -1, 'hour');
                        break;
                    case TimeSegment.TYPE_MINUTE:
                        date.add(is_data_to_ihm ? 1 : -1, 'minute');
                        break;
                    case TimeSegment.TYPE_MONTH:
                        date.add(is_data_to_ihm ? 1 : -1, 'month');
                        break;
                    case TimeSegment.TYPE_MS:
                        date.add(is_data_to_ihm ? 1 : -1, 'ms');
                        break;
                    case TimeSegment.TYPE_SECOND:
                        date.add(is_data_to_ihm ? 1 : -1, 'second');
                        break;
                    case TimeSegment.TYPE_WEEK:
                        date.add(is_data_to_ihm ? 1 : -1, 'week');
                        break;
                    case TimeSegment.TYPE_YEAR:
                    case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                        date.add(is_data_to_ihm ? 1 : -1, 'year');
                        break;
                    case TimeSegment.TYPE_DAY:
                    default:
                        date.add(is_data_to_ihm ? 1 : -1, 'day');
                }
            } else {

                switch (moduleTableField.segmentation_type) {
                    case TimeSegment.TYPE_HOUR:
                        date.add(is_data_to_ihm ? -1 : 1, 'hour');
                        break;
                    case TimeSegment.TYPE_MINUTE:
                        date.add(is_data_to_ihm ? -1 : 1, 'minute');
                        break;
                    case TimeSegment.TYPE_MONTH:
                        date.add(is_data_to_ihm ? -1 : 1, 'month');
                        break;
                    case TimeSegment.TYPE_MS:
                        date.add(is_data_to_ihm ? -1 : 1, 'ms');
                        break;
                    case TimeSegment.TYPE_SECOND:
                        date.add(is_data_to_ihm ? -1 : 1, 'second');
                        break;
                    case TimeSegment.TYPE_WEEK:
                        date.add(is_data_to_ihm ? -1 : 1, 'week');
                        break;
                    case TimeSegment.TYPE_YEAR:
                    case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                        date.add(is_data_to_ihm ? -1 : 1, 'year');
                    case TimeSegment.TYPE_DAY:
                        break;
                    default:
                        date.add(is_data_to_ihm ? -1 : 1, 'day');
                }
            }
        }

        return date;
    }

    public constructor(
        datatable_field_uid: string,
        translatable_title: string = null) {
        super(DatatableField.SIMPLE_FIELD_TYPE, datatable_field_uid, translatable_title);
    }

    get max_values(): number {

        return this.moduleTableField.max_values;
    }

    get min_values(): number {

        return this.moduleTableField.min_values;
    }

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableField.defaultDataToReadIHM(e, this.moduleTableField, vo, this.datatable_field_uid) as any;
    }
    public dataToUpdateIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableField.defaultDataToUpdateIHM(e, this.moduleTableField, vo, this.datatable_field_uid) as any;
    }
    public dataToCreateIHM(e: T, vo: IDistantVOBase): U {
        return this.dataToUpdateIHM(e, vo);
    }

    public ReadIHMToData(e: U, vo: IDistantVOBase): T {
        return SimpleDatatableField.defaultReadIHMToData(e, this.moduleTableField, vo) as any;
    }
    public UpdateIHMToData(e: U, vo: IDistantVOBase): T {
        return SimpleDatatableField.defaultUpdateIHMToData(e, this.moduleTableField, vo) as any;
    }
    public CreateIHMToData(e: U, vo: IDistantVOBase): T {
        return this.UpdateIHMToData(e, vo);
    }

    get moduleTableField(): ModuleTableField<T> {
        if (!this.moduleTable) {
            return null;
        }
        return this.moduleTable.getFieldFromId(this.module_table_field_id);
    }

    public enumIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if ((typeof id === 'undefined') || (id === null)) {
            return null;
        }

        return LocaleManager.getInstance().i18n.t(this.moduleTableField.enum_values[id]);
    }

    public setModuleTable(moduleTable: ModuleTable<any>) {
        this.moduleTable = moduleTable;

        if (!this.translatable_title) {
            this.translatable_title = this.moduleTable.getFieldFromId(this.module_table_field_id).field_label.code_text;
        }
        if (this.module_table_field_id != this.datatable_field_uid) {
            this.translatable_title = this.translatable_title.substr(0, this.translatable_title.indexOf(DefaultTranslation.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
        }

        this.is_required = this.moduleTableField.field_required;
        this.validate = this.validate ? this.validate : this.moduleTableField.validate;

        return this;
    }

    public getValidationTextCodeBase(): string {
        return this.moduleTableField.getValidationTextCodeBase();
    }

    public dataToHumanReadableField(e: IDistantVOBase): U {
        let res = this.dataToReadIHM(e[this.datatable_field_uid], e);

        if ((this.type == SimpleDatatableField.SIMPLE_FIELD_TYPE) && (this.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_boolean)) {

            // FIXME TODO si on est sur un boolean on voudrait voir idéalement OUI/NON et pas true /false mais ça dépend de la langue donc c'est pas si simple...
            return res;
        }

        if (res == null) {
            return '' as any as U;
        }

        return res;
    }
}