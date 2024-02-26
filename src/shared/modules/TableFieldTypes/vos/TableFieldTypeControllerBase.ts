import Datatable from '../../DAO/vos/datatable/Datatable';
import SimpleDatatableFieldVO from '../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import ITableFieldTypeCreateUpdateComponent from '../interfaces/ITableFieldTypeCreateUpdateComponent';
import ITableFieldTypeReadComponent from '../interfaces/ITableFieldTypeReadComponent';

export default abstract class TableFieldTypeControllerBase {


    // public is_date_filtered_field: boolean = false;
    // public is_text_filtered_field: boolean = false;

    public read_component: ITableFieldTypeReadComponent;
    public create_update_component: ITableFieldTypeCreateUpdateComponent;

    constructor(public name: string) { }

    // ModuleTableFieldVO hooks
    public abstract isAcceptableCurrentDBType(db_type: string): boolean;
    public abstract getPGSqlFieldType(): string;
    public abstract defaultValidator(data: any, field: ModuleTableFieldVO<any>): string;

    public abstract dataToIHM<T extends IDistantVOBase, U extends IDistantVOBase>(vo: T, field: SimpleDatatableFieldVO<any, any>, res: U, datatable: Datatable<any>, isUpdate: boolean);
    public abstract IHMToData<T extends IDistantVOBase, U extends IDistantVOBase>(vo: T, field: SimpleDatatableFieldVO<any, any>, res: U, datatable: Datatable<any>, isUpdate: boolean);

    public abstract getIHMToExportString<T extends IDistantVOBase>(vo: T, field: SimpleDatatableFieldVO<any, any>, datatable: Datatable<any>): string;

    public abstract defaultDataToReadIHM<T extends IDistantVOBase>(field_value: any, moduleTableField: ModuleTableFieldVO<any>, vo: T): any;
    public abstract defaultReadIHMToData<T extends IDistantVOBase>(value: any, moduleTableField: ModuleTableFieldVO<any>, vo: T): any;

    public abstract defaultforceNumeric<T extends IDistantVOBase>(e: T, field: ModuleTableFieldVO<any>);
    // FIXME TODO ASAP fonction inverse public abstract defaultforceNumeric<T extends IDistantVOBase>(e: T, field: ModuleTableFieldVO<any>);

    // TODO FIXME pas prioritaire mais TODO
    // public abstract handle_filters_preload();

    // TODO FIXME pas prioritaire mais TODO
    // public abstract customFilter(row, query): any[];
}