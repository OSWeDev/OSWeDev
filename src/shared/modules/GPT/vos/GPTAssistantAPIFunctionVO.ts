
import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIFunctionParamVO from './GPTAssistantAPIFunctionParamVO';

export default class GPTAssistantAPIFunctionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant";

    public id: number;
    public _type: string = GPTAssistantAPIFunctionVO.API_TYPE_ID;

    public module_name: string;
    public module_function: string;

    public description: string;
    public name: string;

    public params: GPTAssistantAPIFunctionParamVO[];

    public to_GPT_FunctionDefinition(): FunctionDefinition {

        let gpt_params: { [param_name: string]: FunctionParameters } = {};

        for (let i in this.params) {
            let param: GPTAssistantAPIFunctionParamVO = this.params[i];

            gpt_params[param.name] = param.to_GPT_FunctionParameters();
        }

        let ret: FunctionDefinition = {
            description: this.description,

            name: this.name,
            parameters: gpt_params
        };

        return ret;
    }

    public ordered_function_params_from_GPT_arguments(args: { [param_name: string]: any }): any[] {

        let ret: any[] = [];

        for (let i in this.params) {
            let param: GPTAssistantAPIFunctionParamVO = this.params[i];
            ret.push(args[param.name]);
        }

        return ret;
    }
}