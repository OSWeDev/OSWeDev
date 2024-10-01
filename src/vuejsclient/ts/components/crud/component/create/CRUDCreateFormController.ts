import DatatableField from "../../../../../../shared/modules/DAO/vos/datatable/DatatableField";
import IDistantVOBase from "../../../../../../shared/modules/IDistantVOBase";

export default class CRUDCreateFormController {

    public static hook_preinit_new_vo_for_creation_when_opened_from_vo_field: {
        [opened_from_api_type_id: string]: {
            [opened_from_datatable_field_uid: string]: <T extends IDistantVOBase>(from_vo: IDistantVOBase, from_field: DatatableField<any, any>, from_field_value: any, vo_to_init: T) => T
        }
    } = {};
}