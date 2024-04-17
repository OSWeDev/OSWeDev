import IDistantVOBase from "../../IDistantVOBase";
import IVersionedVO from "../../Versioned/interfaces/IVersionedVO";

/**
 * Définition d'un authentification externe pour un partenaire
 */
export default class ExternalAPIAuthentificationVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "external_api_authentification";

    public static TYPE_LABELS: string[] = [
        'ExternalAPIAuthentificationVO.TYPE_NONE',
        'ExternalAPIAuthentificationVO.TYPE_API_KEY_BASIC',
        'ExternalAPIAuthentificationVO.TYPE_API_KEY_BEARER',
        'ExternalAPIAuthentificationVO.TYPE_API_KEY_CUSTOM',
        'ExternalAPIAuthentificationVO.TYPE_OAUTH',
    ];
    public static TYPE_NONE: number = 0;
    public static TYPE_API_KEY_BASIC: number = 1;
    public static TYPE_API_KEY_BEARER: number = 2;
    public static TYPE_API_KEY_CUSTOM: number = 3;
    public static TYPE_OAUTH: number = 4;

    public static OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_LABELS: string[] = [
        'ExternalAPIAuthentificationVO.OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_DEFAULT_POST',
        'ExternalAPIAuthentificationVO.OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_HEADER',
    ];
    public static OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_DEFAULT_POST: number = 0;
    public static OAUTH_TOKEN_EXCHANGE_METHOD_TYPE_HEADER: number = 1;

    public id: number;
    public _type: string = ExternalAPIAuthentificationVO.API_TYPE_ID;

    public name: string;

    public type: number;
    public api_key: string;
    public custom_header_name: string;

    public oauth_client_id: string;
    public oauth_client_secret: string;
    public oauth_token_url: string;
    public oauth_authorization_url: string;
    public oauth_scopes: string;
    public oatuh_token_exchange_method_type: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}