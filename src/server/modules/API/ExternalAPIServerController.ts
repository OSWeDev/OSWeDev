import axios from 'axios';
import ExternalAPIAuthentificationVO from '../../../shared/modules/API/vos/ExternalAPIAuthentificationVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import OseliaReferrerExternalAPIVO from '../../../shared/modules/Oselia/vos/OseliaReferrerExternalAPIVO';

export default class ExternalAPIServerController {

    public static async call_external_api(
        method: 'get' | 'post' | 'put' | 'delete',
        url: string,
        post_data: any,
        external_api_authentication_id: number,
        accept: string = 'application/json',
        content_type: string = 'application/json',
    ) {
        const external_api_authentication: ExternalAPIAuthentificationVO = external_api_authentication_id ?
            await query(ExternalAPIAuthentificationVO.API_TYPE_ID)
                .filter_by_id(external_api_authentication_id)
                .exec_as_server()
                .select_vo<ExternalAPIAuthentificationVO>() : null;

        if (external_api_authentication_id && !external_api_authentication) {
            ConsoleHandler.error('ExternalAPIServerController: external_api_authentication not found for id: ' + external_api_authentication_id);
            return null;
        }

        const headers = {
            'Accept': accept,
            'Content-Type': content_type,
        };

        if (external_api_authentication) {
            switch (external_api_authentication.type) {
                case ExternalAPIAuthentificationVO.TYPE_API_KEY_BASIC:
                    headers['Authorization'] = external_api_authentication.api_key;
                    break;
                case ExternalAPIAuthentificationVO.TYPE_API_KEY_BEARER:
                    headers['Authorization'] = "Bearer " + external_api_authentication.api_key;
                    break;
                case ExternalAPIAuthentificationVO.TYPE_API_KEY_CUSTOM:
                    headers[external_api_authentication.custom_header_name] = external_api_authentication.api_key;
                    break;
                case ExternalAPIAuthentificationVO.TYPE_OAUTH:
                    throw new Error('ExternalAPIServerController: TYPE_OAUTH not implemented');
                case ExternalAPIAuthentificationVO.TYPE_NONE:
                    break;
                default:
                    throw new Error('ExternalAPIServerController: unknown auth type: ' + external_api_authentication.type);
            }
        }

        let res = null;

        try {
            res = await axios({
                method: method,
                url: url,
                headers: headers,
                params: ((method === 'get') && post_data && Object.keys(post_data)) ? post_data : undefined, // Utiliser params pour GET
                data: ((method !== 'get') && post_data && Object.keys(post_data)) ? post_data : undefined, // Utiliser data pour les autres méthodes
            });
        } catch (error) {
            ConsoleHandler.error('ExternalAPIServerController: error calling external api: ' + url + ' - ' + error);
            return null;
        }

        return res.data;
    }
}