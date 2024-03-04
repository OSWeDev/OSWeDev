/* istanbul ignore file: WARNING No test on module main file, causes trouble, but NEEDs to externalize any function that can profite a test */

import UserVO from '../AccessPolicy/vos/UserVO';
import NumSegment from '../DataRender/vos/NumSegment';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import VarsInitController from '../Var/VarsInitController';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import UserDataRangesVO from './vars/vos/UserDataRangesVO';
import UserMinDataRangesVO from './vars/vos/UserMinDataRangesVO';

export default class ModuleUserLogVars extends Module {

    public static MODULE_NAME: string = "UserLogVars";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleUserLogVars {
        if (!ModuleUserLogVars.instance) {
            ModuleUserLogVars.instance = new ModuleUserLogVars();
        }
        return ModuleUserLogVars.instance;
    }

    private static instance: ModuleUserLogVars = null;

    private constructor() {

        super("user_log_vars", ModuleUserLogVars.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeUserMinDataRangesVO();
        this.initializeUserDataRangesVO();
    }
    private initializeUserDataRangesVO() {
        let user_id_ranges = new ModuleTableField('user_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            user_id_ranges,
        ];

        VarsInitController.getInstance().register_var_data(UserDataRangesVO.API_TYPE_ID, () => new UserDataRangesVO(), datatable_fields, this);
        user_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }

    private initializeUserMinDataRangesVO() {
        let user_id_ranges = new ModuleTableField('user_id_ranges', ModuleTableField.FIELD_TYPE_numrange_array, 'Utilisateurs', true).set_segmentation_type(NumSegment.TYPE_INT);

        let datatable_fields = [
            user_id_ranges,
            new ModuleTableField('ts_ranges', ModuleTableField.FIELD_TYPE_tstzrange_array, 'Dates').set_segmentation_type(TimeSegment.TYPE_MINUTE).set_format_localized_time(false),
        ];

        VarsInitController.getInstance().register_var_data(UserMinDataRangesVO.API_TYPE_ID, () => new UserMinDataRangesVO(), datatable_fields, this);
        user_id_ranges.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
    }
}
