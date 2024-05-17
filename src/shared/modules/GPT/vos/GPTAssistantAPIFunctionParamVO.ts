
import { FunctionParameters } from 'openai/resources';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class GPTAssistantAPIFunctionParamVO implements IDistantVOBase, IVersionedVO {

    public static API_TYPE_ID: string = "gpt_assistant_function_param";

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
        'string': GPTAssistantAPIFunctionParamVO.TYPE_STRING,
        'number': GPTAssistantAPIFunctionParamVO.TYPE_NUMBER,
        'boolean': GPTAssistantAPIFunctionParamVO.TYPE_BOOLEAN,
        'integer': GPTAssistantAPIFunctionParamVO.TYPE_INTEGER,
        'object': GPTAssistantAPIFunctionParamVO.TYPE_OBJECT,
        'array': GPTAssistantAPIFunctionParamVO.TYPE_ARRAY,
        'null': GPTAssistantAPIFunctionParamVO.TYPE_NULL,
    };

    public static TYPE_TO_OPENAI: { [type: number]: string } = {
        [GPTAssistantAPIFunctionParamVO.TYPE_STRING]: 'string',
        [GPTAssistantAPIFunctionParamVO.TYPE_NUMBER]: 'number',
        [GPTAssistantAPIFunctionParamVO.TYPE_BOOLEAN]: 'boolean',
        [GPTAssistantAPIFunctionParamVO.TYPE_INTEGER]: 'integer',
        [GPTAssistantAPIFunctionParamVO.TYPE_OBJECT]: 'object',
        [GPTAssistantAPIFunctionParamVO.TYPE_ARRAY]: 'array',
        [GPTAssistantAPIFunctionParamVO.TYPE_NULL]: 'null',
    };

    public id: number;
    public _type: string = GPTAssistantAPIFunctionParamVO.API_TYPE_ID;

    public function_id: number;

    public required: boolean;

    public type: number;
    public gpt_funcparam_name: string;
    public gpt_funcparam_description: string;

    public string_enum: string[];
    public number_enum: number[];

    public object_fields: GPTAssistantAPIFunctionParamVO[];

    public array_items_type: number;

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

    public static from_GPT_FunctionParameters(from: any): GPTAssistantAPIFunctionParamVO {

        if (!from) {
            return null;
        }

        const res: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();

        res.type = GPTAssistantAPIFunctionParamVO.TYPE_FROM_OPENAI[from.type];
        res.gpt_funcparam_description = from.description;

        if (from.enum) {
            if (res.type == GPTAssistantAPIFunctionParamVO.TYPE_STRING) {
                res.string_enum = from.enum;
            }

            if ((res.type == GPTAssistantAPIFunctionParamVO.TYPE_NUMBER) || (res.type == GPTAssistantAPIFunctionParamVO.TYPE_INTEGER)) {
                res.number_enum = from.enum;
            }
        }

        if (from.properties) {
            res.object_fields = [];

            for (const i in from.properties) {
                const field: GPTAssistantAPIFunctionParamVO = GPTAssistantAPIFunctionParamVO.from_GPT_FunctionParameters(from.properties[i]);

                field.gpt_funcparam_name = i;

                res.object_fields.push(field);
            }
        }

        if (from.items) {
            res.array_items_type = GPTAssistantAPIFunctionParamVO.TYPE_FROM_OPENAI[from.items.type];
        }

        return res;
    }

    public to_GPT_FunctionParameters(): FunctionParameters {

        const res: FunctionParameters = {
            type: GPTAssistantAPIFunctionParamVO.TYPE_LABELS[this.type],
            description: this.gpt_funcparam_description,
        };

        if ((this.type == GPTAssistantAPIFunctionParamVO.TYPE_STRING) && this.string_enum) {
            res['enum'] = this.string_enum;
        }

        if (((this.type == GPTAssistantAPIFunctionParamVO.TYPE_NUMBER) || (this.type == GPTAssistantAPIFunctionParamVO.TYPE_INTEGER)) && this.number_enum) {
            res['enum'] = this.number_enum;
        }

        if ((this.type == GPTAssistantAPIFunctionParamVO.TYPE_OBJECT) && this.object_fields) {
            const fields: { [field_name: string]: FunctionParameters } = {};

            for (const i in this.object_fields) {
                const field: GPTAssistantAPIFunctionParamVO = this.object_fields[i];

                fields[field.gpt_funcparam_name] = field.to_GPT_FunctionParameters();
            }

            res['properties'] = fields;
        }

        if ((this.type == GPTAssistantAPIFunctionParamVO.TYPE_ARRAY) && (this.array_items_type != null)) {
            res['items'] = {
                type: GPTAssistantAPIFunctionParamVO.TYPE_LABELS[this.array_items_type]
            };
        }

        return res;
    }
}