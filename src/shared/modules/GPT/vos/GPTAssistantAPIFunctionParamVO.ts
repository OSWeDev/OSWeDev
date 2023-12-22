
import { FunctionParameters } from 'openai/resources';
import IDistantVOBase from '../../IDistantVOBase';

export default class GPTAssistantAPIFunctionParamVO implements IDistantVOBase {

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

    public id: number;
    public _type: string = GPTAssistantAPIFunctionParamVO.API_TYPE_ID;

    public type: number;
    public name: string;
    public description: string;

    public string_enum: string[];
    public number_enum: number[];

    public object_fields: GPTAssistantAPIFunctionParamVO[];

    public array_items_type: number;

    public to_GPT_FunctionParameters(): FunctionParameters {

        let res: FunctionParameters = {
            type: GPTAssistantAPIFunctionParamVO.TYPE_LABELS[this.type],
            description: this.description,
        };

        if ((this.type == GPTAssistantAPIFunctionParamVO.TYPE_STRING) && this.string_enum) {
            res['enum'] = this.string_enum;
        }

        if (((this.type == GPTAssistantAPIFunctionParamVO.TYPE_NUMBER) || (this.type == GPTAssistantAPIFunctionParamVO.TYPE_INTEGER)) && this.number_enum) {
            res['enum'] = this.number_enum;
        }

        if ((this.type == GPTAssistantAPIFunctionParamVO.TYPE_OBJECT) && this.object_fields) {
            let fields: { [field_name: string]: FunctionParameters } = {};

            for (let i in this.object_fields) {
                let field: GPTAssistantAPIFunctionParamVO = this.object_fields[i];

                fields[field.name] = field.to_GPT_FunctionParameters();
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