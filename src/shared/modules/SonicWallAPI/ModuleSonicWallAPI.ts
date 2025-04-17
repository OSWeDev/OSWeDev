import { field_names, reflect } from '../../tools/ObjectHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import SonicWallAPIAddressObjects from './apis/address_objects/SonicWallAPIAddressObjects';
import SonicWallAPINatPolicies from './apis/nat_policies/SonicWallAPINatPolicies';
import SonicWallAPIResult from './apis/result/SonicWallAPIResult';
import SonicWallAPIThreatLog from './apis/threat_log/SonicWallAPIThreatLog';
import SonicWallAPIParamVO from './vos/SonicWallAPIParamVO';

export default class ModuleSonicWallAPI extends Module {

    public static MODULE_NAME: string = 'SonicWallAPI';

    private static instance: ModuleSonicWallAPI = null;

    public auth: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().auth);
    public start_management: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().start_management);
    public logout: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().logout);
    public config_mode: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().config_mode);
    public non_config_mode: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().non_config_mode);
    public get_nat_policies_ipv4: () => Promise<SonicWallAPINatPolicies> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().get_nat_policies_ipv4);
    public get_address_objects_ipv4_name: (name: string) => Promise<SonicWallAPIAddressObjects> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().get_address_objects_ipv4_name);
    public create_address_objects_ipv4: (data: SonicWallAPIAddressObjects) => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().create_address_objects_ipv4);
    public get_config_pending: () => Promise<unknown> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().get_config_pending);
    public save_config_pending: () => Promise<SonicWallAPIResult> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().save_config_pending);
    public get_dynamic_files_threat_log: () => Promise<SonicWallAPIThreatLog> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().get_dynamic_files_threat_log);
    public get_export_sysfile_threat_log_csv: (name: string) => Promise<string> = APIControllerWrapper.sah_optimizer(this.name, reflect<ModuleSonicWallAPI>().get_export_sysfile_threat_log_csv);

    private constructor() {
        super("sonicwallapi", ModuleSonicWallAPI.MODULE_NAME);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSonicWallAPI {
        if (!ModuleSonicWallAPI.instance) {
            ModuleSonicWallAPI.instance = new ModuleSonicWallAPI();
        }
        return ModuleSonicWallAPI.instance;
    }

    public registerApis() {
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().auth,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().start_management,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().logout,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().config_mode,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().non_config_mode,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(GetAPIDefinition.new<null, SonicWallAPINatPolicies>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().get_nat_policies_ipv4,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(GetAPIDefinition.new<StringParamVO, SonicWallAPIAddressObjects>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().get_address_objects_ipv4_name,
            [SonicWallAPIParamVO.API_TYPE_ID],
            StringParamVOStatic,
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<SonicWallAPIAddressObjects, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().create_address_objects_ipv4,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(GetAPIDefinition.new<unknown, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().get_config_pending,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(PostAPIDefinition.new<null, SonicWallAPIResult>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().save_config_pending,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(GetAPIDefinition.new<null, SonicWallAPIThreatLog>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().get_dynamic_files_threat_log,
            [SonicWallAPIParamVO.API_TYPE_ID],
        ));
        APIControllerWrapper.registerApi(GetAPIDefinition.new<StringParamVO, string>(
            null,
            this.name,
            reflect<ModuleSonicWallAPI>().get_export_sysfile_threat_log_csv,
            [SonicWallAPIParamVO.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    public initialize() {
        this.initializeSonicWallAPIParamVO();
    }

    private initializeSonicWallAPIParamVO(): void {
        ModuleTableFieldController.create_new(SonicWallAPIParamVO.API_TYPE_ID, field_names<SonicWallAPIParamVO>().ip, ModuleTableFieldVO.FIELD_TYPE_string, "ip", true);
        ModuleTableFieldController.create_new(SonicWallAPIParamVO.API_TYPE_ID, field_names<SonicWallAPIParamVO>().port, ModuleTableFieldVO.FIELD_TYPE_string, "port", true);
        ModuleTableFieldController.create_new(SonicWallAPIParamVO.API_TYPE_ID, field_names<SonicWallAPIParamVO>().username, ModuleTableFieldVO.FIELD_TYPE_string, "username", true);
        ModuleTableFieldController.create_new(SonicWallAPIParamVO.API_TYPE_ID, field_names<SonicWallAPIParamVO>().password, ModuleTableFieldVO.FIELD_TYPE_string, "password", true);

        ModuleTableController.create_new(this.name, SonicWallAPIParamVO, null, "SonicWallAPI Param");
    }
}