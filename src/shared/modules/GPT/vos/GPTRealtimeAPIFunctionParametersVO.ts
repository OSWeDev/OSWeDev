
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIErrorVO from './GPTAssistantAPIErrorVO';

export default class GPTRealtimeAPIFunctionParametersVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_realtime_function_parameters";

    public static TYPE_LABELS: string[] = [
        "string",
        "number",
        "boolean",
        "integer",
        "object",
        "array",
        "null"
    ];
    public static TYPE_STRING: number = 0;
    public static TYPE_NUMBER: number = 1;
    public static TYPE_BOOLEAN: number = 2;
    public static TYPE_INTEGER: number = 3;
    public static TYPE_OBJECT: number = 4;
    public static TYPE_ARRAY: number = 5;
    public static TYPE_NULL: number = 6;

    public static TYPE_FROM_OPENAI: { [type: string]: number } = {
        'string': GPTRealtimeAPIFunctionParametersVO.TYPE_STRING,
        'number': GPTRealtimeAPIFunctionParametersVO.TYPE_NUMBER,
        'boolean': GPTRealtimeAPIFunctionParametersVO.TYPE_BOOLEAN,
        'integer': GPTRealtimeAPIFunctionParametersVO.TYPE_INTEGER,
        'object': GPTRealtimeAPIFunctionParametersVO.TYPE_OBJECT,
        'array': GPTRealtimeAPIFunctionParametersVO.TYPE_ARRAY,
        'null': GPTRealtimeAPIFunctionParametersVO.TYPE_NULL,
    };

    public static TYPE_TO_OPENAI: { [type: number]: string } = {
        [GPTRealtimeAPIFunctionParametersVO.TYPE_STRING]: 'string',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_NUMBER]: 'number',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_BOOLEAN]: 'boolean',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_INTEGER]: 'integer',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_OBJECT]: 'object',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_ARRAY]: 'array',
        [GPTRealtimeAPIFunctionParametersVO.TYPE_NULL]: 'null',
    };

    public id: number;
    public _type: string = GPTRealtimeAPIFunctionParametersVO.API_TYPE_ID;
    public name: string;
    public description: string;
    public function_id: number;

    public required: boolean;

    public type: number;

    public string_enum: string[];
    public number_enum: number[];

    public object_fields: GPTRealtimeAPIFunctionParametersVO[];

    public array_items_type: number;

    /**
     * Pour les params d'url, on propose de ne pas transmettre ce param comme param de fonction.
     *  Pas obligatoire puisque des fois l'API peut avoir besoin de ce param pour construire l'URL ET en param de fonction
     */
    public not_in_function_params: boolean;

    /**
     * A voir si on peut faire évoluer mais pour le moment à saisir en JSON ("1" si string 1 dans le champs de saisie, ou 1 si number 1, etc...)
     */
    public default_json_value: string;

    public weight: number;

    public archived: boolean;

    // IVersionedVO
    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}