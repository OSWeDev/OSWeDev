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
import DateHandler from '../../../../../shared/tools/DateHandler';
import HourHandler from '../../../../../shared/tools/HourHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import VueComponentBase from '../../VueComponentBase';
import DatatableField from './DatatableField';

export default class SimpleDatatableField<T, U> extends DatatableField<T, U> {

    public static async defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): Promise<any> {
        if ((field_value == null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {
                case ModuleTableField.FIELD_TYPE_prct:
                    return VueComponentBase.const_filters.percent.read(field_value, 2);

                case ModuleTableField.FIELD_TYPE_amount:
                    return VueComponentBase.const_filters.amount.read(field_value);

                case ModuleTableField.FIELD_TYPE_translatable_text:
                    return LocaleManager.getInstance().label(field_value);

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return VueComponentBase.const_filters.hour.read(field_value);

                case ModuleTableField.FIELD_TYPE_enum:
                    return LocaleManager.getInstance().i18n.t(moduleTableField.enum_values[field_value]);

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:

                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(this.getMomentDateFieldInclusif(moment(field_value), moduleTableField, true));

                case ModuleTableField.FIELD_TYPE_month:
                    return moment(field_value).format('MMM YYYY');

                case ModuleTableField.FIELD_TYPE_timestamp:
                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(field_value)) + ' ' + moment(field_value).format('HH:mm:ss');

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
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(parts[0].trim()));
                        }
                        res += '-';
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(this.getMomentDateFieldInclusif(moment(parts[1].trim()), moduleTableField, true));
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

                case ModuleTableField.FIELD_TYPE_int_array:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_string_array:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_timewithouttimezone:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_tstz:
                    switch (moduleTableField.segmentation_type) {
                        case TimeSegment.TYPE_MONTH:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('month').format('Y-MM-DD');
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('day').format('Y-MM-DD');
                        case TimeSegment.TYPE_WEEK:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).startOf('isoWeek').format('Y-MM-DD');
                        case TimeSegment.TYPE_YEAR:
                            return field_value.year();
                        case TimeSegment.TYPE_DAY:
                        default:
                            return this.getMomentDateFieldInclusif(field_value, moduleTableField, true).format('Y-MM-DD');
                    }

                default:

                    for (let j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (moduleTableField.field_type == tableFieldTypeController.name) {
                            return await tableFieldTypeController.defaultDataToReadIHM(field_value, moduleTableField, vo);
                        }
                    }

                    return field_value.toString();
            }
        } catch (error) {
            console.error(error);
            return field_value;
        }
    }

    public static async defaultDataToUpdateIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): Promise<any> {
        if ((field_value == null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {

                case ModuleTableField.FIELD_TYPE_enum:
                    return field_value;

                case ModuleTableField.FIELD_TYPE_boolean:
                    if (moduleTableField.field_required) {
                        return (!field_value) ? false : true;
                    }
                    return field_value;

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return DateHandler.getInstance().formatDayForVO(this.getMomentDateFieldInclusif(moment(field_value), moduleTableField, true));
                case ModuleTableField.FIELD_TYPE_month:
                    return DateHandler.getInstance().formatMonthFromVO(this.getMomentDateFieldInclusif(moment(field_value), moduleTableField, true));


                default:
                    return await SimpleDatatableField.defaultDataToReadIHM(field_value, moduleTableField, vo);
            }
        } catch (error) {
            console.error(error);
            return field_value;
        }
    }

    public static defaultReadIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((value == null) || (typeof value == "undefined")) {
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
                    return parseFloat(VueComponentBase.const_filters.percent.write(value));

                case ModuleTableField.FIELD_TYPE_amount:
                    return parseFloat(VueComponentBase.const_filters.amount.write(value));

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return parseFloat(VueComponentBase.const_filters.hour.write(value));

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
                    return value ? DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(moment(value), moduleTableField, false)) : null;
                case ModuleTableField.FIELD_TYPE_month:
                    return value ? DateHandler.getInstance().formatDayForSQL(moment(value).startOf('month')) : null;

                case ModuleTableField.FIELD_TYPE_int_array:
                    return '{' + value.join() + '}';

                case ModuleTableField.FIELD_TYPE_string_array:
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
                        default:
                            return value ? this.getMomentDateFieldInclusif(moment(value).startOf('day').utc(true), moduleTableField, false) : null;
                    }

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
            console.error(error);
            return value;
        }
    }

    public static defaultUpdateIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((value == null) || (typeof value == "undefined")) {
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
            console.error(error);
            return value;
        }
    }

    private static getMomentDateFieldInclusif(momentSrc: Moment, moduleTableField: ModuleTableField<any>, is_data_to_ihm: boolean): Moment {
        let date = moment(momentSrc);
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

    public async dataToReadIHM(e: T, vo: IDistantVOBase): Promise<U> {
        return await SimpleDatatableField.defaultDataToReadIHM(e, this.moduleTableField, vo) as any;
    }
    public async dataToUpdateIHM(e: T, vo: IDistantVOBase): Promise<U> {
        return await SimpleDatatableField.defaultDataToUpdateIHM(e, this.moduleTableField, vo) as any;
    }
    public async dataToCreateIHM(e: T, vo: IDistantVOBase): Promise<U> {
        return await this.dataToUpdateIHM(e, vo);
    }

    public async ReadIHMToData(e: U, vo: IDistantVOBase): Promise<T> {
        return await SimpleDatatableField.defaultReadIHMToData(e, this.moduleTableField, vo) as any;
    }
    public async UpdateIHMToData(e: U, vo: IDistantVOBase): Promise<T> {
        return await SimpleDatatableField.defaultUpdateIHMToData(e, this.moduleTableField, vo) as any;
    }
    public async CreateIHMToData(e: U, vo: IDistantVOBase): Promise<T> {
        return await this.UpdateIHMToData(e, vo);
    }

    get moduleTableField(): ModuleTableField<T> {
        if (!this.moduleTable) {
            return null;
        }
        return this.moduleTable.getFieldFromId(this.module_table_field_id);
    }

    public enumIdToHumanReadable: (id: number) => string = (id: number) => {
        let res: string = "";

        if ((typeof id === 'undefined') || (id == null)) {
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

    public async dataToHumanReadableField(e: IDistantVOBase): Promise<U> {
        return await this.dataToReadIHM(e[this.datatable_field_uid], e);
    }
}