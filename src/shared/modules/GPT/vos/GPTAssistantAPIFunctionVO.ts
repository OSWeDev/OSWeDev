
import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIFunctionParamVO from './GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIThreadVO from './GPTAssistantAPIThreadVO';

export default class GPTAssistantAPIFunctionVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "gpt_assistant_function";

    public id: number;
    public _type: string = GPTAssistantAPIFunctionVO.API_TYPE_ID;

    public module_name: string;
    public module_function: string;

    public gpt_function_description: string;
    public gpt_function_name: string;

    public prepend_thread_vo: boolean;

    public to_GPT_FunctionDefinition(params: GPTAssistantAPIFunctionParamVO[]): FunctionDefinition {

        const gpt_params: { [param_name: string]: FunctionParameters } = {};

        for (const i in params) {
            const param: GPTAssistantAPIFunctionParamVO = params[i];

            gpt_params[param.gpt_funcparam_name] = param.to_GPT_FunctionParameters();
        }

        const ret: FunctionDefinition = {
            description: this.gpt_function_description,

            name: this.gpt_function_name,
            parameters: gpt_params
        };

        return ret;
    }

    public ordered_function_params_from_GPT_arguments(function_vo: GPTAssistantAPIFunctionVO, thread_vo: GPTAssistantAPIThreadVO, args: { [param_name: string]: any }, params: GPTAssistantAPIFunctionParamVO[]): any[] {

        const ret: any[] = [];

        for (const i in params) {
            const param: GPTAssistantAPIFunctionParamVO = params[i];
            ret.push(args[param.gpt_funcparam_name]);
        }

        if (function_vo.prepend_thread_vo) {
            ret.unshift(thread_vo);
        }

        return ret;
    }
}