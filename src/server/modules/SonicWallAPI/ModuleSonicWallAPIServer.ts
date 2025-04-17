import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import SonicWallAPIAddressObjects from '../../../shared/modules/SonicWallAPI/apis/address_objects/SonicWallAPIAddressObjects';
import SonicWallAPINatPolicies from '../../../shared/modules/SonicWallAPI/apis/nat_policies/SonicWallAPINatPolicies';
import SonicWallAPIResult from '../../../shared/modules/SonicWallAPI/apis/result/SonicWallAPIResult';
import SonicWallAPIThreatLog from '../../../shared/modules/SonicWallAPI/apis/threat_log/SonicWallAPIThreatLog';
import ModuleSonicWallAPI from '../../../shared/modules/SonicWallAPI/ModuleSonicWallAPI';
import SonicWallAPIParamVO from '../../../shared/modules/SonicWallAPI/vos/SonicWallAPIParamVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../shared/tools/ObjectHandler';
import ModuleServerBase from '../ModuleServerBase';
import { Controller, Post, Route, Body, SuccessResponse, Delete, Tags, Get, Path } from 'tsoa';

@Route('api_handler')
@Tags('SonicWallAPI')
export default class ModuleSonicWallAPIServer extends ModuleServerBase {

    private static BASE_API_URL: string = '/api/sonicos/';

    private static instance: ModuleSonicWallAPIServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSonicWallAPI.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSonicWallAPIServer.instance) {
            ModuleSonicWallAPIServer.instance = new ModuleSonicWallAPIServer();
        }
        return ModuleSonicWallAPIServer.instance;
    }

    /**
     * Permet de s'authentifier à l'API SonicWall
     * @returns SonicWallAPIResult
     * @summary Authentification de l'API SonicWall
     * @description Authentification de l'API SonicWall
     */
    @SuccessResponse('200', "Authentification réussie")
    @Post('sonicwallapi__auth')
    public async auth(): Promise<SonicWallAPIResult> {
        return this.sendRequest<SonicWallAPIResult>('auth', ModuleRequest.METHOD_POST);
    }

    @SuccessResponse('200', "Activation du mode de gestion réussie")
    @Post('sonicwallapi__start_management')
    public async start_management(): Promise<SonicWallAPIResult> {
        await this.auth();
        return this.sendRequest<SonicWallAPIResult>('start-management', ModuleRequest.METHOD_POST);
    }

    @SuccessResponse('200', "Déconnexion réussie")
    @Post('sonicwallapi__logout')
    public async logout(): Promise<SonicWallAPIResult> {
        return this.sendRequest<SonicWallAPIResult>('auth', ModuleRequest.METHOD_DELETE);
    }

    @SuccessResponse('200', "Activation du mode de configuration réussie")
    @Post('sonicwallapi__config_mode')
    public async config_mode(): Promise<SonicWallAPIResult> {
        await this.start_management();
        return this.sendRequest<SonicWallAPIResult>('config-mode', ModuleRequest.METHOD_POST);
    }

    @SuccessResponse('200', "Désactivation du mode de configuration réussie")
    @Post('sonicwallapi__non_config_mode')
    public async non_config_mode(): Promise<SonicWallAPIResult> {
        return this.sendRequest<SonicWallAPIResult>('non-config-mode', ModuleRequest.METHOD_POST);
    }

    @SuccessResponse('200', "Récupération des politiques NAT IPv4 réussie")
    @Get('sonicwallapi__get_nat_policies_ipv4')
    public async get_nat_policies_ipv4(): Promise<SonicWallAPINatPolicies> {
        await this.start_management();

        const res = await this.sendRequest<SonicWallAPINatPolicies>('nat-policies/ipv4', ModuleRequest.METHOD_GET);

        await this.logout();

        return res;
    }

    @SuccessResponse('200', "Récupération des objets d'adresse IPv4 réussie")
    @Get('sonicwallapi__get_address_objects_ipv4_name/{text}')
    public async get_address_objects_ipv4_name(
        @Path("text") name: string
    ): Promise<SonicWallAPIAddressObjects> {
        if (!name) {
            throw new Error('Name is required');
        }

        await this.start_management();

        const res = await this.sendRequest<SonicWallAPIAddressObjects>('address-objects/ipv4/name/' + encodeURIComponent(name), ModuleRequest.METHOD_GET);

        await this.logout();

        return res;
    }

    @SuccessResponse('200', "Création d'objets d'adresse IPv4 réussie")
    @Post('sonicwallapi__create_address_objects_ipv4')
    public async create_address_objects_ipv4(
        @Body() data: SonicWallAPIAddressObjects
    ): Promise<SonicWallAPIResult> {
        if (!data) {
            throw new Error('Data is required');
        }

        await this.config_mode();

        const res = await this.sendRequest<SonicWallAPIResult>('address-objects/ipv4', ModuleRequest.METHOD_POST, data);

        await this.logout();

        return res;
    }

    @SuccessResponse('200', "Récupération de la configuration en attente réussie")
    @Get('sonicwallapi__get_config_pending')
    public async get_config_pending(): Promise<unknown> {
        await this.start_management();

        const res = await this.sendRequest<unknown>('config/pending', ModuleRequest.METHOD_GET);

        await this.logout();

        return res;
    }

    public async save_config_pending(): Promise<SonicWallAPIResult> {
        await this.config_mode();

        const res = await this.sendRequest<SonicWallAPIResult>('config/pending', ModuleRequest.METHOD_POST);

        await this.logout();

        return res;
    }

    public async get_dynamic_files_threat_log(): Promise<SonicWallAPIThreatLog> {
        await this.start_management();

        const res = await this.sendRequest<SonicWallAPIThreatLog>('dynamic-file/getThreatLogDbFiles.json', ModuleRequest.METHOD_GET);

        await this.logout();

        return res;
    }

    public async get_export_sysfile_threat_log_csv(name: string): Promise<string> {
        if (!name) {
            throw new Error('Name is required');
        }

        await this.start_management();

        const res = await this.sendRequest<string>('export/sysfile/threatlogcsv/csv/' + encodeURIComponent(name.replace('threatlogs', '')), ModuleRequest.METHOD_GET);

        await this.logout();

        return res;
    }

    public registerApis(): void {
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().auth, this.auth.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().start_management, this.start_management.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().logout, this.logout.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().config_mode, this.config_mode.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().non_config_mode, this.non_config_mode.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().get_nat_policies_ipv4, this.get_nat_policies_ipv4.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().get_address_objects_ipv4_name, this.get_address_objects_ipv4_name.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().create_address_objects_ipv4, this.create_address_objects_ipv4.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().get_config_pending, this.get_config_pending.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().save_config_pending, this.save_config_pending.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().get_dynamic_files_threat_log, this.get_dynamic_files_threat_log.bind(this));
        APIControllerWrapper.register_server_api_handler(this.name, reflect<ModuleSonicWallAPI>().get_export_sysfile_threat_log_csv, this.get_export_sysfile_threat_log_csv.bind(this));
    }

    private async sendRequest<T>(
        api_name: string,
        method: string,
        posts: any = null,
    ): Promise<T> {
        const params: SonicWallAPIParamVO = await this.get_params();

        if (!api_name) {
            throw new Error('API name is required');
        }

        if (!method) {
            throw new Error('API method is required');
        }

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(params.username + ':' + params.password).toString('base64')
        };

        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

        let res: T = null;

        try {
            res = await ModuleRequest.getInstance().sendRequestFromApp(
                method,
                params.ip,
                (ModuleSonicWallAPIServer.BASE_API_URL + api_name),
                posts,
                headers,
                true,
                null,
                false,
                true,
            );
        } catch (e) {
            if (!e?.datas) {
                if (e?.message) {
                    ConsoleHandler.error(e?.message);
                } else {
                    ConsoleHandler.error(e);
                }
            }

            res = e.datas;
        }

        delete process.env["NODE_TLS_REJECT_UNAUTHORIZED"];

        return res;
    }

    private async get_params(): Promise<SonicWallAPIParamVO> {
        const res: SonicWallAPIParamVO = await query(SonicWallAPIParamVO.API_TYPE_ID)
            .set_limit(1)
            .select_vo();

        if (!res) {
            throw new Error('No SonicWall API parameters found');
        }

        return res;
    }
}