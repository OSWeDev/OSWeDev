import ObjectHandler from '../../../../tools/ObjectHandler';
import Datatable from '../../../DAO/vos/datatable/Datatable';
import SimpleDatatableFieldVO from '../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../IDistantVOBase';
import ModuleTableField from '../../../ModuleTableField';
import TableFieldTypeControllerBase from '../../../TableFieldTypes/vos/TableFieldTypeControllerBase';
import AnimationMessageModuleVO from './vos/AnimationMessageModuleVO';

export default class MessageModuleTableFieldTypeController extends TableFieldTypeControllerBase {

    public static getInstance(): MessageModuleTableFieldTypeController {
        if (!MessageModuleTableFieldTypeController.instance) {
            MessageModuleTableFieldTypeController.instance = new MessageModuleTableFieldTypeController();
        }
        return MessageModuleTableFieldTypeController.instance;
    }

    private static instance: MessageModuleTableFieldTypeController = null;

    private constructor() {
        super(AnimationMessageModuleVO.API_TYPE_ID);
    }

    public isAcceptableCurrentDBType(db_type: string): boolean {
        return db_type == "text";
    }

    public getPGSqlFieldType(): string {
        return "text";
    }

    public defaultValidator(data: any): string {
        return null;
    }

    public dataToIHM(vo: IDistantVOBase, field: SimpleDatatableFieldVO<any, any>, res: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean) {
        res[field.datatable_field_uid] = vo[field.module_table_field_id];
    }
    public IHMToData(vo: IDistantVOBase, field: SimpleDatatableFieldVO<any, any>, res: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean) {
        res[field.module_table_field_id] = vo[field.datatable_field_uid];
    }

    public getIHMToExportString(vo: IDistantVOBase, field: SimpleDatatableFieldVO<any, any>, datatable: Datatable<any>) {
        let res: string = '';
        let messages: AnimationMessageModuleVO[] = ObjectHandler.try_get_json(vo[field.datatable_field_uid]);

        for (let i in messages) {
            let message: AnimationMessageModuleVO = messages[0];

            if (!message) {
                continue;
            }

            if (res.length > 0) {
                res += '<br><br>';
            }

            res += 'Min : ' + message.min + '<br>';
            res += 'Max : ' + message.max + '<br>';
            res += 'Message : ' + message.message;
        }

        return res;
    }

    public defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        return field_value;
    }
    public defaultReadIHMToData(value: any, moduleTableField: ModuleTableField<any>, vo: IDistantVOBase): any {
        return value;
    }

    public defaultforceNumeric<T extends IDistantVOBase>(e: T, field: ModuleTableField<any>) {

        if ((!e) || (!field) || (!e[field.field_id])) {
            return;
        }

        e[field.field_id] = JSON.parse(e[field.field_id]);
    }
}