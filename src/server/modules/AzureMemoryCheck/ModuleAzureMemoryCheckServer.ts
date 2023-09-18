import axios from "axios";
import ModuleAzureMemoryCheck from '../../../shared/modules/AzureMemoryCheck/ModuleAzureMemoryCheck';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { all_promises } from "../../../shared/tools/PromiseTools";
import ModuleServerBase from '../ModuleServerBase';
import AzureMemoryCheckServerController from "./AzureMemoryCheckServerController";

export default class ModuleAzureMemoryCheckServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleAzureMemoryCheckServer.instance) {
            ModuleAzureMemoryCheckServer.instance = new ModuleAzureMemoryCheckServer();
        }
        return ModuleAzureMemoryCheckServer.instance;
    }

    private static instance: ModuleAzureMemoryCheckServer = null;
    private static interval: NodeJS.Timeout = null;

    private static AZURE_CHECK_MEMORY_ACTIVATION_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_ACTIVATION";

    private static AZURE_CHECK_MEMORY_CLIENT_ID_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_CLIENT_ID";
    private static AZURE_CHECK_MEMORY_CLIENT_SECRET_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_CLIENT_SECRET";
    private static AZURE_CHECK_MEMORY_TENANT_ID_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_TENANT_ID";
    private static AZURE_CHECK_MEMORY_SUBSCRIPTION_ID_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_SUBSCRIPTION_ID";
    private static AZURE_CHECK_MEMORY_RESOURCE_GROUP_NAME_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_RESOURCE_GROUP_NAME";
    private static AZURE_CHECK_MEMORY_SERVER_NAME_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_SERVER_NAME";

    private static AZURE_CHECK_MEMORY_USAGE_DATA_MAX_SIZE_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_USAGE_DATA_MAX_SIZE";
    private static AZURE_CHECK_MEMORY_AZURE_MEM_SIZE_PARAM_NAME: string = "ModuleAzureMemoryCheck.AZURE_CHECK_MEMORY_AZURE_MEM_SIZE";

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleAzureMemoryCheck.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        let activated = await ModuleParams.getInstance().getParamValueAsBoolean(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_ACTIVATION_PARAM_NAME, false, 180000);

        if (!activated) {
            return;
        }
        ConsoleHandler.log('Activation du module AzureMemoryCheck');
        ModuleAzureMemoryCheckServer.interval = setInterval(this.getAvailableMemory.bind(this), 1000);
    }

    // Le plan, c'est vérifier toutes les secondes la mémoire libre, suivre l'évolution sur 60 secondes et si on a une vitesse de remplissage
    //  de la mémoire qui augmente et qui dépasse un certain seuil, on réduit le nombre de connexions simultanées à la base de données vi un coef du promise pipeline.
    private async getAvailableMemory(): Promise<void> {

        // Get params
        let promises = [];

        let activated = false;
        let clientId: string = null;
        let clientSecret: string = null;
        let tenantId: string = null;
        let subscriptionId: string = null;
        let resourceGroupName: string = null;
        let serverName: string = null;

        let memory_usage_data_max_size: number = null;
        let azure_mem_size: number = null;

        promises.push(ModuleParams.getInstance().getParamValueAsBoolean(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_ACTIVATION_PARAM_NAME, false, 180000).then((res) => {
            activated = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_CLIENT_ID_PARAM_NAME, null, 180000).then((res) => {
            clientId = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_CLIENT_SECRET_PARAM_NAME, null, 180000).then((res) => {
            clientSecret = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_TENANT_ID_PARAM_NAME, null, 180000).then((res) => {
            tenantId = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_SUBSCRIPTION_ID_PARAM_NAME, null, 180000).then((res) => {
            subscriptionId = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_RESOURCE_GROUP_NAME_PARAM_NAME, null, 180000).then((res) => {
            resourceGroupName = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsString(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_SERVER_NAME_PARAM_NAME, null, 180000).then((res) => {
            serverName = res;
        }));

        promises.push(ModuleParams.getInstance().getParamValueAsInt(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_USAGE_DATA_MAX_SIZE_PARAM_NAME, 60, 180000).then((res) => {
            memory_usage_data_max_size = res;
        }));
        promises.push(ModuleParams.getInstance().getParamValueAsInt(ModuleAzureMemoryCheckServer.AZURE_CHECK_MEMORY_AZURE_MEM_SIZE_PARAM_NAME, null, 180000).then((res) => {
            azure_mem_size = res;
        }));

        await all_promises(promises);

        if (!activated || !clientId || !clientSecret || !tenantId || !subscriptionId || !resourceGroupName || !serverName || !memory_usage_data_max_size || !azure_mem_size) {

            ConsoleHandler.warn('Désactivation du module AzureMemoryCheck car paramètres manquants ou désactivation via param - impossible de relancer le check sans redémarrer le pool d\'application');
            if (ModuleAzureMemoryCheckServer.interval) {
                clearInterval(ModuleAzureMemoryCheckServer.interval);
                ModuleAzureMemoryCheckServer.interval = null;
            }
            return null;
        }

        const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
        const metricEndpoint = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DBforPostgreSQL/servers/${serverName}/metrics?api-version=2017-12-01`;

        // Get token
        const tokenResponse = await axios.post(tokenEndpoint, {
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            resource: "https://management.azure.com/"
        });

        const token = tokenResponse.data.access_token;

        // Get metrics
        const metricResponse = await axios.get(metricEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                metricnames: "available_memory" // Adjust this as per the exact metric name for available memory
            }
        });

        // Extract available memory from the response
        const memoryData = metricResponse.data.value[0]?.timeseries[0]?.data || [];
        if (memoryData.length) {
            AzureMemoryCheckServerController.addMemoryUsageData(this.translate_to_prct(azure_mem_size, memoryData[memoryData.length - 1].average), memory_usage_data_max_size);
        }
    }

    private translate_to_prct(azure_mem_size: number, mem_usage: number): number {
        return Math.round((mem_usage / azure_mem_size) * 100);
    }
}