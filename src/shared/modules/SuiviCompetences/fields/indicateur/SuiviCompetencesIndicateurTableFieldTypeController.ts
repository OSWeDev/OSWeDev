import ConsoleHandler from '../../../../tools/ConsoleHandler';
import Datatable from '../../../DAO/vos/datatable/Datatable';
import SimpleDatatableFieldVO from '../../../DAO/vos/datatable/SimpleDatatableFieldVO';
import IDistantVOBase from '../../../IDistantVOBase';
import ModuleTableField from '../../../ModuleTableField';
import TableFieldTypeControllerBase from '../../../TableFieldTypes/vos/TableFieldTypeControllerBase';
import SuiviCompetencesItemVO from '../../vos/SuiviCompetencesItemVO';
import SuiviCompetencesIndicateurVO from './vos/SuiviCompetencesIndicateurVO';

export default class SuiviCompetencesIndicateurTableFieldTypeController extends TableFieldTypeControllerBase {

    public static getInstance(): SuiviCompetencesIndicateurTableFieldTypeController {
        if (!SuiviCompetencesIndicateurTableFieldTypeController.instance) {
            SuiviCompetencesIndicateurTableFieldTypeController.instance = new SuiviCompetencesIndicateurTableFieldTypeController();
        }
        return SuiviCompetencesIndicateurTableFieldTypeController.instance;
    }

    private static instance: SuiviCompetencesIndicateurTableFieldTypeController = null;

    private constructor() {
        super(SuiviCompetencesIndicateurVO.API_TYPE_ID);
    }

    public get_value(item: SuiviCompetencesItemVO): SuiviCompetencesIndicateurVO[] {
        if ((!!item) && (!!item.indicateurs) && (item.indicateurs != '') && (item.indicateurs != '[]') && (item.indicateurs != '[{}]')) {
            try {
                let values: SuiviCompetencesIndicateurVO[] = JSON.parse(item.indicateurs);

                for (let obj of values) {
                    obj.titre = (obj.titre != null) ? obj.titre : null;
                    obj.description = (obj.description != null) ? obj.description : null;
                }

                return values;
            } catch (error) {
                ConsoleHandler.error(error);
                ConsoleHandler.error("PB SuiviCompetencesIndicateurTableFieldTypeController.get_value :: item_id " + item.id);
            }
        }

        return null;
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
        return null;
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