import ObjectHandler from '../../../../tools/ObjectHandler';
import Datatable from '../../../DAO/vos/datatable/Datatable';
import SimpleDatatableFieldVO from '../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../IDistantVOBase';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../ModuleTableFieldVO';
import TableFieldTypeControllerBase from '../../../TableFieldTypes/vos/TableFieldTypeControllerBase';
import AnimationReponseVO from './vos/AnimationReponseVO';

export default class ReponseTableFieldTypeController extends TableFieldTypeControllerBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): ReponseTableFieldTypeController {
        if (!ReponseTableFieldTypeController.instance) {
            ReponseTableFieldTypeController.instance = new ReponseTableFieldTypeController();
        }
        return ReponseTableFieldTypeController.instance;
    }

    private static instance: ReponseTableFieldTypeController = null;

    private constructor() {
        super(AnimationReponseVO.API_TYPE_ID);
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
        res[field.datatable_field_uid] = vo[field.module_table_field_name];
    }
    public IHMToData(vo: IDistantVOBase, field: SimpleDatatableFieldVO<any, any>, res: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean) {
        res[field.module_table_field_name] = vo[field.datatable_field_uid];
    }

    public getIHMToExportString(vo: IDistantVOBase, field: SimpleDatatableFieldVO<any, any>, datatable: Datatable<any>) {
        let res: string = '';
        const responses: AnimationReponseVO[] = ObjectHandler.try_get_json(vo[field.datatable_field_uid]);

        for (const i in responses) {
            const reponse: AnimationReponseVO = responses[0];

            if (!reponse) {
                continue;
            }

            if (res.length > 0) {
                res += '<br><br>';
            }

            res += 'Réponse : ' + reponse.name + '<br>';
            res += 'Valide : ' + reponse.valid;
            res += 'Ordre : ' + reponse.weight + '<br>';
        }

        return res;
    }

    public defaultDataToReadIHM(field_value: any, moduleTableField: ModuleTableFieldVO, vo: IDistantVOBase): any {
        return field_value;
    }
    public defaultReadIHMToData(value: any, moduleTableField: ModuleTableFieldVO, vo: IDistantVOBase): any {
        return value;
    }

    public defaultforceNumeric<T extends IDistantVOBase>(e: T, field: ModuleTableFieldVO) {

        if ((!e) || (!field) || (!e[field.field_name])) {
            return;
        }

        e[field.field_name] = JSON.parse(e[field.field_name]);
    }
}