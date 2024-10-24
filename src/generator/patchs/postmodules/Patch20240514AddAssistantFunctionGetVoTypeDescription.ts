import { IDatabase } from "pg-promise";
import GPTAssistantAPIFunctionGetVoTypeDescriptionController from "../../../server/modules/GPT/functions/get_vo_type_description/GPTAssistantAPIFunctionGetVoTypeDescriptionController";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20240514AddAssistantFunctionGetVoTypeDescription implements IGeneratorWorker {

    private static instance: Patch20240514AddAssistantFunctionGetVoTypeDescription = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240514AddAssistantFunctionGetVoTypeDescription';
    }

    public static getInstance(): Patch20240514AddAssistantFunctionGetVoTypeDescription {
        if (!Patch20240514AddAssistantFunctionGetVoTypeDescription.instance) {
            Patch20240514AddAssistantFunctionGetVoTypeDescription.instance = new Patch20240514AddAssistantFunctionGetVoTypeDescription();
        }
        return Patch20240514AddAssistantFunctionGetVoTypeDescription.instance;
    }

    public async work(db: IDatabase<unknown>) {
        await GPTAssistantAPIFunctionGetVoTypeDescriptionController.create_function_and_params_description_if_not_exists();
    }
}