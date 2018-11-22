import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import DatatableField from './DatatableField';
import VueComponentBase from '../../VueComponentBase';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import DateHandler from '../../../../../shared/tools/DateHandler';
import * as moment from 'moment';
import DefaultTranslation from '../../../../../shared/modules/Translation/vos/DefaultTranslation';
import LocaleManager from '../../../../../shared/tools/LocaleManager';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';

export default class SimpleDatatableField<T, U> extends DatatableField<T, U> {

    public static defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        if ((field_value == null) || (typeof field_value == "undefined")) {
            return field_value;
        }

        try {
            switch (moduleTableField.field_type) {
                case ModuleTableField.FIELD_TYPE_prct:
                    return VueComponentBase.const_filters.percent.read(field_value);

                case ModuleTableField.FIELD_TYPE_amount:
                    return VueComponentBase.const_filters.amount.read(field_value);

                case ModuleTableField.FIELD_TYPE_hours_and_minutes:
                case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
                    return VueComponentBase.const_filters.hour.read(field_value);

                case ModuleTableField.FIELD_TYPE_enum:
                    return LocaleManager.getInstance().i18n.t(moduleTableField.enum_values[field_value]);

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(field_value));

                case ModuleTableField.FIELD_TYPE_timestamp:
                    return ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(field_value)) + ' ' + moment(field_value).format('HH:mm:ss');

                case ModuleTableField.FIELD_TYPE_daterange:
                    // On stocke au format day - day
                    if (!field_value) {
                        return field_value;
                    }

                    let parts: string[] = field_value.replace(/[\(\)\[\]]/g, '').split(',');
                    if ((!parts) || (parts.length <= 0)) {
                        return field_value;
                    }

                    let res: string = "";
                    if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                        res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(parts[0].trim()));
                    }
                    res += '-';
                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                        res += ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(moment(parts[1].trim()));
                    }

                    return res;

                default:
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
                    return field_value;

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
                        res += DateHandler.getInstance().formatDayForSQL(moment(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim())));
                    }
                    res += ',';
                    if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                        res += DateHandler.getInstance().formatDayForSQL(moment(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim())));
                    }
                    res += ')';

                    return res;

                case ModuleTableField.FIELD_TYPE_date:
                case ModuleTableField.FIELD_TYPE_day:
                    return DateHandler.getInstance().formatDayForSQL(moment(value));

                default:
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
    }

    public getValidationTextCodeBase(): string {
        return this.moduleTableField.getValidationTextCodeBase();
    }

    public dataToHumanReadableField(e: IDistantVOBase): U {
        return this.dataToReadIHM(e[this.datatable_field_uid], e);
    }
}