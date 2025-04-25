const XmlReader = require('xml-reader');
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleKelio from '../../../shared/modules/Kelio/ModuleKelio';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import AccessPolicyServerController from '../AccessPolicy/AccessPolicyServerController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleServerBase from '../ModuleServerBase';
import ModulesManagerServer from '../ModulesManagerServer';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import XmlNode from '../../../shared/modules/DataImport/vos/XmlNode';
import KelioEmployeeVO from '../../../shared/modules/Kelio/vos/KelioEmployeeVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ObjectHandler, { field_names } from '../../../shared/tools/ObjectHandler';
import KelioLightEmployeeAPI from '../../../shared/modules/Kelio/apis/KelioLightEmployeeAPI';
import { cloneDeep } from 'lodash';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ImportKelioEmployeeCronWorkersHandler from './ImportKelioEmployeeCronWorkersHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class ModuleKelioServer extends ModuleServerBase {

    private static instance: ModuleKelioServer = null;

    private static URL_BASE_SERVICE: string = '/open/services/';
    private static URL_SERVICE_LIGHT_EMPLOYEE: string = 'LightEmployeeService';
    private static SOAP_ACTION_exportLightEmployees: string = 'exportLightEmployees';

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleKelio.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleKelioServer.instance) {
            ModuleKelioServer.instance = new ModuleKelioServer();
        }
        return ModuleKelioServer.instance;
    }

    public registerCrons(): void {
        ImportKelioEmployeeCronWorkersHandler.getInstance();
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleKelio.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, DefaultTranslationVO.create_new({
            'fr-fr': 'Kelio'
        }));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleKelio.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, DefaultTranslationVO.create_new({
            'fr-fr': 'Administration Kelio'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let admin_access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        admin_access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        admin_access_dependency.src_pol_id = bo_access.id;
        admin_access_dependency.depends_on_pol_id = AccessPolicyServerController.get_registered_policy(ModuleAccessPolicy.POLICY_BO_ACCESS).id;
        admin_access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(admin_access_dependency);

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleKelio.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, DefaultTranslationVO.create_new({
            'fr-fr': 'Accès front - Kelio'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
    }

    public async exportLightEmployees() {
        const api_employees: KelioLightEmployeeAPI[] = await this.sendRequest<KelioLightEmployeeAPI>(
            ModuleKelioServer.SOAP_ACTION_exportLightEmployees,
            ModuleKelioServer.URL_SERVICE_LIGHT_EMPLOYEE,
            KelioLightEmployeeAPI
        );

        if (!api_employees?.length) {
            return;
        }

        const bdd_employee_by_employee_identification_number: { [employee_identification_number: string]: KelioEmployeeVO } = ObjectHandler.mapByStringFieldFromArray(
            await query(KelioEmployeeVO.API_TYPE_ID).select_vos(),
            field_names<KelioEmployeeVO>().employee_identification_number
        );

        const to_save: KelioEmployeeVO[] = [];

        for (const i in api_employees) {
            const api_employee: KelioLightEmployeeAPI = api_employees[i];

            if (!api_employee.employeeIdentificationNumber) {
                ConsoleHandler.warn('Pas de matricule pour l\'employé : ' + JSON.stringify(api_employee));
                continue;
            }

            const bdd_employee: KelioEmployeeVO = bdd_employee_by_employee_identification_number[api_employee.employeeIdentificationNumber];
            let new_employee: KelioEmployeeVO = new KelioEmployeeVO();

            if (!!bdd_employee) {
                new_employee = cloneDeep(bdd_employee);
            }

            new_employee.archived_employee = (api_employee.archivedEmployee == 'true');
            new_employee.employee_surname = api_employee.employeeSurname;
            new_employee.employee_first_name = api_employee.employeeFirstName;
            new_employee.period_start_date = (api_employee.takenIntoAccountPeriodStartDate?.length) ? Dates.parse(api_employee.takenIntoAccountPeriodStartDate, 'yyyy-MM-dd', false) : null;
            new_employee.period_end_date = (api_employee.takenIntoAccountPeriodEndDate?.length) ? Dates.parse(api_employee.takenIntoAccountPeriodStartDate, 'yyyy-MM-dd', false) : null;
            new_employee.employee_identification_number = api_employee.employeeIdentificationNumber;

            // Si je n'ai pas l'employée ou qu'il y a une modification, je l'enregistre en BDD
            if (
                !bdd_employee ||
                bdd_employee.archived_employee != new_employee.archived_employee ||
                bdd_employee.employee_first_name != new_employee.employee_first_name ||
                bdd_employee.employee_surname != new_employee.employee_surname ||
                bdd_employee.period_start_date != new_employee.period_start_date ||
                bdd_employee.period_end_date != new_employee.period_end_date ||
                bdd_employee.employee_identification_number != new_employee.employee_identification_number
            ) {
                to_save.push(new_employee);
            }
        }

        if (to_save?.length) {
            await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(to_save);
        }
    }

    private async sendRequest<T>(soap_action: string, url_service: string, object_constructor: { new(): T }): Promise<T[]> {
        const kelio_login: string = await ModuleParams.getInstance().getParamValueAsString(ModuleKelio.KELIO_LOGIN_PARAM_NAME, null, 360000);
        const kelio_password: string = await ModuleParams.getInstance().getParamValueAsString(ModuleKelio.KELIO_PASSWORD_PARAM_NAME, null, 360000);
        const kelio_base_url: string = await ModuleParams.getInstance().getParamValueAsString(ModuleKelio.KELIO_BASE_URL_PARAM_NAME, null, 360000);

        if (!kelio_login || !kelio_password || !kelio_base_url || !soap_action || !url_service || !object_constructor) {
            return null;
        }

        const soapRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ech="http://echange.service.open.bodet.com">
            <soapenv:Header/>
            <soapenv:Body>
                <ech:` + soap_action + `>
                </ech:` + soap_action + `>>
            </soapenv:Body>
            </soapenv:Envelope>
        `;

        const datas = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_POST,
            kelio_base_url,
            ModuleKelioServer.URL_BASE_SERVICE + url_service,
            soapRequest,
            {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'urn:' + soap_action,
                'Authorization': 'Basic ' + Buffer.from(kelio_login + ':' + kelio_password).toString('base64'),
            },
            true,
            null,
            true,
            true,
            false
        );

        if (!datas?.length) {
            return null;
        }

        const res_node: XmlNode = XmlReader.parseSync(datas.toString());

        const res: T[] = [];

        this.read_xml_recursive<T>(res_node, res, new object_constructor(), object_constructor);

        return res;
    }

    private read_xml_recursive<T>(datas: XmlNode, results: T[], new_result: T, object_constructor: { new(): T }) {
        if (datas?.parent?.name && datas.children.length === 0 && datas.value) {
            // Ajouter l'élément à l'objet employé avec le bon nom de champ
            new_result[datas.parent.name.replace(/^ns1:/, '')] = datas.value;
        }

        if (datas.children?.length > 0) {
            if (datas.name === 'ns1:LightEmployee') {
                const new_result2: T = new object_constructor();
                datas.children.forEach(child => this.read_xml_recursive(child, results, new_result2, object_constructor));
                results.push(new_result2);
            }

            datas.children.forEach(child => this.read_xml_recursive(child, results, new_result, object_constructor));
        }
    }
}