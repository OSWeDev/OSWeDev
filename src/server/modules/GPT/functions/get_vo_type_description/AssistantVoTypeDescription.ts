import AssistantVoFieldDescription from "./AssistantVoFieldDescription";

export default class AssistantVoTypeDescription {
    public api_type_id: string;
    public error?: string;

    public name: string;
    public description: string;

    public fields: AssistantVoFieldDescription[];
}