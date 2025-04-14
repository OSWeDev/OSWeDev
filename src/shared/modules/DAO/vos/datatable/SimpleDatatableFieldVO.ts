

import moment from 'moment';
import ModuleTableFieldVO from '../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import HourRange from '../../../../../shared/modules/DataRender/vos/HourRange';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import TSRange from '../../../../../shared/modules/DataRender/vos/TSRange';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import DefaultTranslationVO from '../../../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import HourHandler from '../../../../../shared/tools/HourHandler';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import { amountFilter, hourFilter, percentFilter } from '../../../../tools/Filters';
import RangeHandler from '../../../../tools/RangeHandler';
import Dates from '../../../FormatDatesNombres/Dates/Dates';
import ModuleTableFieldController from '../../ModuleTableFieldController';
import DatatableField from './DatatableField';

export default class SimpleDatatableFieldVO<T, U> extends DatatableField<T, U> {

    public static API_TYPE_ID: string = "simple_dtf";
    public _type: string = SimpleDatatableFieldVO.API_TYPE_ID;

    get translatable_title(): string {
        if (!this.vo_type_full_name) {
            return null;
        }

        if (!this.moduleTableField) {
            return 'id'; // Cas de l'id
        }

        if (this.translatable_title_custom) {
            return this.translatable_title_custom;
        }

        const trad = ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[this.moduleTable.vo_type] ? ModuleTableFieldController.default_field_translation_by_vo_type_and_field_name[this.moduleTable.vo_type][this.moduleTableField.field_name] : null;
        const e = trad ? trad.code_text : null;
        if (this.module_table_field_id != this.datatable_field_uid) {
            return e.substr(0, e.indexOf(DefaultTranslationVO.DEFAULT_LABEL_EXTENSION)) + "." + this.datatable_field_uid + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
        } else {
            return e;
        }
    }

    get max_values(): number {

        return this.moduleTableField.max_values;
    }

    get min_values(): number {

        return this.moduleTableField.min_values;
    }

    public static createNew(datatable_field_uid: string): SimpleDatatableFieldVO<any, any> {

        const res = new SimpleDatatableFieldVO();

        res.init(
            SimpleDatatableFieldVO.API_TYPE_ID,
            DatatableField.SIMPLE_FIELD_TYPE,
            datatable_field_uid
        );

        return res;
    }

    public async dataToReadIHM(field_value: any, vo: IDistantVOBase): Promise<any> {
        if (DatatableField.computed_value && DatatableField.computed_value[this.datatable_field_uid]) {
            return DatatableField.computed_value[this.datatable_field_uid](field_value, this.moduleTableField, vo, this.datatable_field_uid);
        }
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (this.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_prct:
                    return percentFilter.read(field_value, 2);

                case ModuleTableFieldVO.FIELD_TYPE_amount:
                    return amountFilter.read(field_value);

                case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    if (this.moduleTableField.translatable_params_field_name) {
                        let params = null;
                        try {
                            params = JSON.parse(vo[this.moduleTableField.translatable_params_field_name]);
                        } catch (error) {
                            ConsoleHandler.error(error);
                        }
                        return LocaleManager.getInstance().label(field_value, params);
                    } else {
                        return LocaleManager.getInstance().label(field_value);
                    }

                case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return hourFilter.read(field_value);

                case ModuleTableFieldVO.FIELD_TYPE_enum:
                    // JNE FIXME TODO : on gère le cas bizarre où field_value est une string directement, et donc on doit pas le retraduire, c'est déjà tout pret
                    if (typeof field_value == 'string') {
                        try {
                            const int_value = parseInt(field_value);
                            if (!isNaN(int_value)) {
                                return LocaleManager.getInstance().t(this.enum_values[int_value]);
                            }
                        } catch (error) {
                            //
                        }
                        return field_value;
                    }
                    return LocaleManager.getInstance().t(this.enum_values[field_value]);

                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_day:

                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment.unix(this.getMomentDateFieldInclusif(field_value, true)).utc());

                case ModuleTableFieldVO.FIELD_TYPE_month:
                    return Dates.format(field_value, 'MMM YYYY');

                case ModuleTableFieldVO.FIELD_TYPE_daterange:

                    // On stocke au format day - day
                    if (!field_value) {
                        return field_value;
                    }

                    let daterange_array = null;
                    if (this.field_type == ModuleTableFieldVO.FIELD_TYPE_daterange) {
                        daterange_array = [field_value];
                    } else {
                        daterange_array = field_value;
                    }

                    let res: string = "";
                    for (const i in daterange_array) {
                        const daterange = daterange_array[i];

                        const parts: string[] = daterange.replace(/[()[\]]/g, '').split(',');
                        if ((!parts) || (parts.length <= 0)) {
                            continue;
                        }

                        res += (res != "") ? ", " : "";
                        if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(parts[0].trim()).utc(true));
                        }
                        res += '-';
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment.unix(this.getMomentDateFieldInclusif(moment(parts[1].trim()).utc(true).unix(), true)).utc());
                        }
                    }

                    return res;

                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_tstzranges = "";

                    for (const i in field_value) {
                        const tstzrange: TSRange = field_value[i] as TSRange;

                        res_tstzranges += (res_tstzranges == "") ? '' : ' + ';

                        res_tstzranges += tstzrange.min_inclusiv ? '[' : '(';
                        res_tstzranges += Dates.format(tstzrange.min, 'DD/MM/Y HH:mm');
                        res_tstzranges += ',';
                        res_tstzranges += Dates.format(tstzrange.max, 'DD/MM/Y HH:mm');
                        res_tstzranges += tstzrange.max_inclusiv ? ']' : ')';
                    }

                    return res_tstzranges;

                case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_hourrange = "";

                    const hourrange_: HourRange = field_value as HourRange;

                    res_hourrange += (res_hourrange == "") ? '' : ' + ';

                    res_hourrange += hourrange_.min_inclusiv ? '[' : '(';
                    res_hourrange += HourHandler.getInstance().formatHourForIHM(hourrange_.min, this.segmentation_type);
                    res_hourrange += ',';
                    res_hourrange += HourHandler.getInstance().formatHourForIHM(hourrange_.max, this.segmentation_type);
                    res_hourrange += hourrange_.max_inclusiv ? ']' : ')';

                    return res_hourrange;

                case ModuleTableFieldVO.FIELD_TYPE_hour:
                    return HourHandler.getInstance().formatHourForIHM(field_value, this.segmentation_type);

                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_hourranges = "";

                    for (const i in field_value) {
                        const hourrange: HourRange = field_value[i] as HourRange;

                        res_hourranges += (res_hourranges == "") ? '' : ' + ';

                        res_hourranges += hourrange.min_inclusiv ? '[' : '(';
                        res_hourranges += HourHandler.getInstance().formatHourForIHM(hourrange.min, this.segmentation_type);
                        res_hourranges += ',';
                        res_hourranges += HourHandler.getInstance().formatHourForIHM(hourrange.max, this.segmentation_type);
                        res_hourranges += hourrange.max_inclusiv ? ']' : ')';
                    }

                    return res_hourranges;

                case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                    if (!field_value) {
                        return field_value;
                    }

                    let res_numranges = "";

                    for (const i in field_value) {
                        const numrange: NumRange = field_value[i] as NumRange;

                        res_numranges += (res_numranges == "") ? '' : ' + ';

                        res_numranges += numrange.min_inclusiv ? '[' : '(';
                        res_numranges += numrange.min;
                        res_numranges += ',';
                        res_numranges += numrange.max;
                        res_numranges += numrange.max_inclusiv ? ']' : ')';
                    }

                    return res_numranges;

                case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    const res_tsrange: string[] = [];

                    let none: boolean = true;


                    const min_period: number = RangeHandler.getSegmentedMin(field_value, this.segmentation_type, 0, this.return_min_value);

                    if (min_period) {
                        res_tsrange.push(Dates.format_segment(min_period, this.segmentation_type, this.format_localized_time));
                        none = false;
                    } else {
                        res_tsrange.push('');
                    }

                    const max_period: number = RangeHandler.getSegmentedMax(field_value, this.segmentation_type, this.max_range_offset, this.return_max_value);

                    if (max_period) {
                        // Si mon max est différent du min, j'ajoute, sinon ça ne sert à rien car ça affiche en double
                        if (max_period != min_period) {
                            res_tsrange.push(Dates.format_segment(max_period, this.segmentation_type, this.format_localized_time));
                            none = false;
                        }
                    } else {
                        res_tsrange.push('');
                    }

                    if (!none) {
                        return res_tsrange.join(' - ');
                    }

                    // none still active field_value may have another format
                    const rgx = /(?:[\[|\(])(\d{10})\,(\d{10})(?:[\]|\)])/; // the actual date_range format may be e.g. "[1577836800,1580515200)"
                    const isStringDateRangeFormat = rgx.test(field_value);

                    if (isStringDateRangeFormat) {
                        const new_field_value = RangeHandler.parseRangeBDD(TSRange.RANGE_TYPE, field_value, (this.segmentation_type ?? TimeSegment.TYPE_SECOND));
                        return await this.dataToReadIHM(new_field_value, vo);
                    }

                    return none ? '∞' : res_tsrange.join(' - ');

                case ModuleTableFieldVO.FIELD_TYPE_numrange:
                    const res_numrange: string[] = [];

                    let none_number: boolean = true;

                    const min_number: number = RangeHandler.getSegmentedMin(field_value, null, 0, this.return_min_value);
                    if (min_number) {
                        res_numrange.push(min_number.toFixed(0));
                        none_number = false;

                    } else {
                        res_numrange.push('');
                    }

                    const max_number: number = RangeHandler.getSegmentedMax(field_value, null, this.max_range_offset, this.return_max_value);

                    if (max_number) {
                        if (max_number.toFixed(0) != min_number.toFixed(0)) {
                            res_numrange.push(max_number.toFixed(0));
                            none_number = false;
                        }
                    } else {
                        res_numrange.push('');
                    }

                    return none_number ? '∞' : res_numrange.join(' - ');

                case ModuleTableFieldVO.FIELD_TYPE_int_array:
                case ModuleTableFieldVO.FIELD_TYPE_float_array:
                case ModuleTableFieldVO.FIELD_TYPE_string_array:
                case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                case ModuleTableFieldVO.FIELD_TYPE_geopoint:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    const date = this.getMomentDateFieldInclusif(field_value, true);
                    return Dates.format_segment(date, this.segmentation_type, this.format_localized_time);

                case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    let res_tstz_array = '';

                    for (const i in field_value) {
                        const fv = field_value[i];

                        if (res_tstz_array != '') {
                            res_tstz_array += ', ';
                        }

                        const date_fv = this.getMomentDateFieldInclusif(fv, true);
                        res_tstz_array += Dates.format_segment(date_fv, this.segmentation_type, this.format_localized_time);
                    }
                    return res_tstz_array;

                case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_textarea:
                default:

                    for (const j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        const tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (this.field_type == tableFieldTypeController.name) {
                            return await tableFieldTypeController.defaultDataToReadIHM(field_value, this.moduleTableField, vo);
                        }
                    }

                    return field_value.toString();
            }
        } catch (error) {
            // ConsoleHandler.error(error);
            return field_value;
        }
    }

    public async dataToUpdateIHM(field_value: any, vo: IDistantVOBase): Promise<any> {
        if ((field_value === null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (this.field_type) {

                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_translatable_text:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_enum:
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_boolean:
                    if (this.is_required) {
                        return (!field_value) ? false : true;
                    }
                    return field_value;

                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_day:
                    return DateHandler.getInstance().formatDayForVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true).unix(), true));
                case ModuleTableFieldVO.FIELD_TYPE_month:
                    return DateHandler.getInstance().formatMonthFromVO(this.getMomentDateFieldInclusif(moment(field_value).utc(true).unix(), true));

                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange:
                case ModuleTableFieldVO.FIELD_TYPE_numrange:
                case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
                case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstz:
                case ModuleTableFieldVO.FIELD_TYPE_tsrange:
                    return field_value;

                default:
                    return this.dataToReadIHM(field_value, vo);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return field_value;
        }
    }

    public ReadIHMToData(value: any, vo: IDistantVOBase): any {
        if ((value === null) || (typeof value == "undefined")) {
            return value;
        }

        try {

            switch (this.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_boolean:
                    if ((value === true) || (value === "true")) {
                        return true;
                    }
                    return false;

                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    return value;

                case ModuleTableFieldVO.FIELD_TYPE_prct:
                    return percentFilter.write(value);

                case ModuleTableFieldVO.FIELD_TYPE_amount:
                    return amountFilter.write(value);

                case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
                case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return hourFilter.write(value);

                case ModuleTableFieldVO.FIELD_TYPE_float:
                case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
                    const efloat = parseFloat(value);
                    return (isNaN(efloat)) ? null : efloat;
                case ModuleTableFieldVO.FIELD_TYPE_int:
                    const eint = parseInt(value);
                    return (isNaN(eint)) ? null : eint;

                case ModuleTableFieldVO.FIELD_TYPE_enum:
                    for (const i in this.enum_values) {
                        if (LocaleManager.getInstance().i18n.t(this.enum_values[i]) == value) {
                            return i;
                        }
                    }
                    return null;

                case ModuleTableFieldVO.FIELD_TYPE_daterange:
                    // On stocke au format "day day"
                    if (!value) {
                        return value;
                    }

                    const parts: string[] = value.split('-');
                    if ((!parts) || (parts.length <= 0)) {
                        return value;
                    }

                    let res: string = "[";
                    if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()).unix());
                    }
                    res += ',';
                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()).unix(), false));
                    }
                    res += ')';

                    return res;

                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_day:
                    return value ? DateHandler.getInstance().formatDayForSQL(this.getMomentDateFieldInclusif(moment(value).utc(true).unix(), false)) : null;
                case ModuleTableFieldVO.FIELD_TYPE_month:
                    return value ? DateHandler.getInstance().formatDayForSQL(moment(value).utc(true).startOf('month').unix()) : null;

                case ModuleTableFieldVO.FIELD_TYPE_float_array:
                case ModuleTableFieldVO.FIELD_TYPE_int_array:
                case ModuleTableFieldVO.FIELD_TYPE_string_array:
                    // JNE: Pourquoi on fait ça ? du coup on se retrouve avec des strings qui décrivent des array format BDD (pas json en plus) plutôt que des string[] et la trad pour la base gérée directement côté serveur...
                    // // ATTENTION - INTERDITION DE METTRE UNE VIRGULE DANS UN CHAMP DE TYPE ARRAY SINON CA FAIT X VALEURS
                    // const values: any[] = [];

                    // for (const j in value) {
                    //     if (value[j]) {
                    //         values.push(value[j]);
                    //     }
                    // }

                    // if (!values || !values.length) {
                    //     return null;
                    // }

                    // return '{' + values + '}';
                    return value;

                case ModuleTableFieldVO.FIELD_TYPE_html_array:
                    return value;

                case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    switch (this.segmentation_type) {
                        case TimeSegment.TYPE_MONTH:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_MONTH) : null;
                        case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_MONTH), false) : null;
                        case TimeSegment.TYPE_WEEK:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_WEEK), false) : null;
                        case TimeSegment.TYPE_YEAR:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_YEAR) : null;
                        case TimeSegment.TYPE_QUARTER:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_QUARTER) : null;
                        case TimeSegment.TYPE_MS:
                            return value ? Dates.startOf(value, TimeSegment.TYPE_MS) : null;
                        case TimeSegment.TYPE_DAY:
                            return value ? this.getMomentDateFieldInclusif(Dates.startOf(value, TimeSegment.TYPE_DAY), false) : null;
                        default:
                            return value ? this.getMomentDateFieldInclusif(value, false) : null;
                    }

                case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                    const res_tstz_array = [];

                    for (const i in value) {
                        const v = value[i];

                        switch (this.segmentation_type) {
                            case TimeSegment.TYPE_MONTH:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_MONTH) : null);
                                break;
                            case TimeSegment.TYPE_ROLLING_YEAR_MONTH_START:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_DAY), false) : null);
                                break;
                            case TimeSegment.TYPE_WEEK:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_WEEK), false) : null);
                                break;
                            case TimeSegment.TYPE_YEAR:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_YEAR) : null);
                                break;
                            case TimeSegment.TYPE_QUARTER:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_QUARTER) : null);
                                break;
                            case TimeSegment.TYPE_MS:
                                res_tstz_array.push(v ? Dates.startOf(v, TimeSegment.TYPE_MS) : null);
                                break;
                            case TimeSegment.TYPE_DAY:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(Dates.startOf(v, TimeSegment.TYPE_DAY), false) : null);
                                break;
                            default:
                                res_tstz_array.push(v ? this.getMomentDateFieldInclusif(v, false) : null);
                                break;
                        }
                    }

                    return res_tstz_array;

                case ModuleTableFieldVO.FIELD_TYPE_textarea:
                default:

                    for (const j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        const tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (this.field_type == tableFieldTypeController.name) {
                            return tableFieldTypeController.defaultReadIHMToData(value, this.moduleTableField, vo);
                        }
                    }

                    return value;
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return value;
        }
    }

    public UpdateIHMToData(value: any, vo: IDistantVOBase): any {
        if ((value === null) || (typeof value == "undefined")) {
            return value;
        }

        try {

            switch (this.field_type) {

                case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                    return value;

                case ModuleTableFieldVO.FIELD_TYPE_enum:
                    return value;

                default:
                    return this.ReadIHMToData(value, vo);
            }
        } catch (error) {
            ConsoleHandler.error(error);
            return value;
        }
    }

    public async dataToCreateIHM(e: T, vo: IDistantVOBase): Promise<U> {
        return this.dataToUpdateIHM(e, vo);
    }

    public CreateIHMToData(e: U, vo: IDistantVOBase): T {
        return this.UpdateIHMToData(e, vo);
    }

    public enumIdToHumanReadable: (id: number) => string = (id: number) => {
        if ((typeof id === 'undefined') || (id === null)) {
            return null;
        }

        return LocaleManager.getInstance().i18n.t(this.enum_values[id]);
    };

    public enumIdToHumanReadableImage: (id: number) => string = (id: number) => {
        if ((typeof id === 'undefined') || (id === null)) {
            return null;
        }

        return this.moduleTableField.enum_image_values ? this.moduleTableField.enum_image_values[id] : null;
    };

    public getValidationTextCodeBase(): string {
        return this.moduleTableField.getValidationTextCodeBase();
    }

    public async dataToHumanReadableField(e: IDistantVOBase): Promise<U> {
        const res = await this.dataToReadIHM(e[this.datatable_field_uid], e);

        if ((this.type == SimpleDatatableFieldVO.SIMPLE_FIELD_TYPE) && (this.field_type == ModuleTableFieldVO.FIELD_TYPE_boolean)) {

            // FIXME TODO si on est sur un boolean on voudrait voir idéalement OUI/NON et pas true /false mais ça dépend de la langue donc c'est pas si simple...
            return res;
        }

        if (res == null) {
            return '' as unknown as U;
        }

        return res;
    }

    private getMomentDateFieldInclusif(momentSrc: number, is_data_to_ihm: boolean): number {
        let date = momentSrc;
        if (this.is_inclusive_data != this.is_inclusive_ihm) {
            if (this.is_inclusive_data) {
                date = Dates.add(date, is_data_to_ihm ? 1 : -1, this.segmentation_type);
            } else {
                date = Dates.add(date, is_data_to_ihm ? -1 : 1, this.segmentation_type);
            }
        }

        return date;
    }
}