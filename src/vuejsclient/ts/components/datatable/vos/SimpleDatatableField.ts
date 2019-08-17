import * as moment from 'moment';
import { Moment } from 'moment';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import DateHandler from '../../../../../shared/tools/DateHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import VueComponentBase from '../../VueComponentBase';
import DatatableField from './DatatableField';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';

export default class SimpleDatatableField<T, U> extends DatatableField<T, U> {

    public static defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((field_value == null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {
                case ModuleTableField.FIELD_TYPE_prct:
                    return VueComponentBase.const_filters.percent.read(field_value, 2);

                case ModuleTableField.FIELD_TYPE_amount:
                    return VueComponentBase.const_filters.amount.read(field_value);

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
                            return tableFieldTypeController.defaultDataToReadIHM(field_value, moduleTableField, vo);
                        }
                    }

                    return field_value.toString();
            }
        } catch (error) {
            console.error(error);
            return field_value;
        }
    }

    public static defaultDataToUpdateIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
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
                    return SimpleDatatableField.defaultDataToReadIHM(field_value, moduleTableField, vo);
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
                    if ((value === true) || (value === "true") || (value === "on")) {
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

    public dataToReadIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableField.defaultDataToReadIHM(e, this.moduleTableField, vo) as any;
    }
    public dataToUpdateIHM(e: T, vo: IDistantVOBase): U {
        return SimpleDatatableField.defaultDataToUpdateIHM(e, this.moduleTableField, vo) as any;
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

    public dataToHumanReadableField(e: IDistantVOBase): U {
        return this.dataToReadIHM(e[this.datatable_field_uid], e);
    }
}