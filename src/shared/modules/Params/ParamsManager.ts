import { all_promises } from "../../tools/PromiseTools";
import ModuleParams from "./ModuleParams";

export default class ParamsManager {

    public static PRELOAD_PARAM_TYPE_STRING: number = 1;
    public static PRELOAD_PARAM_TYPE_INT: number = 2;
    public static PRELOAD_PARAM_TYPE_FLOAT: number = 3;
    public static PRELOAD_PARAM_TYPE_BOOLEAN: number = 4;
    public static PRELOAD_PARAM_TYPE_OBJECT: number = 5;
    public static preload_params: { [param_name: string]: { value: unknown, type: number, loaded: boolean } } = {};

    public static async reloadPreloadParams(): Promise<void> {
        if (!this.preload_params) {
            return;
        }

        const promises = [];

        for (const param_name in this.preload_params) {
            promises.push(this.reloadPreloadParam(param_name));
        }

        await all_promises(promises); // Attention Promise[] ne maintient pas le stackcontext a priori de façon systématique, contrairement au PromisePipeline. Ce n'est pas un contexte client
    }

    public static async reloadPreloadParam(param_name: string): Promise<void> {
        let loaded: boolean = true;

        switch (this.preload_params[param_name].type) {
            case this.PRELOAD_PARAM_TYPE_STRING:
                this.preload_params[param_name].value = await ModuleParams.getInstance().getParamValueAsString(param_name, null, null);
                break;
            case this.PRELOAD_PARAM_TYPE_INT:
                this.preload_params[param_name].value = await ModuleParams.getInstance().getParamValueAsInt(param_name, null, null);
                break;
            case this.PRELOAD_PARAM_TYPE_FLOAT:
                this.preload_params[param_name].value = await ModuleParams.getInstance().getParamValueAsFloat(param_name, null, null);
                break;
            case this.PRELOAD_PARAM_TYPE_BOOLEAN:
                this.preload_params[param_name].value = await ModuleParams.getInstance().getParamValueAsBoolean(param_name, null, null);
                break;
            case this.PRELOAD_PARAM_TYPE_OBJECT:
                this.preload_params[param_name].value = await ModuleParams.getInstance().getParamValueAsString(param_name, null, null);

                if (this.preload_params[param_name].value) {
                    try {
                        this.preload_params[param_name].value = JSON.parse(this.preload_params[param_name].value as string);
                    } catch (e) {
                        console.error(e);
                        loaded = false;
                    }
                }
                break;
            default:
                loaded = false;
                break;
        }

        this.preload_params[param_name].loaded = loaded;
    }

    public static addPreloadParams(preload_params: Array<{ param_name: string, type: number }>) {
        for (const param of preload_params) {
            this.preload_params[param.param_name] = { value: null, type: param.type, loaded: false };
        }
    }

    public static getParamValue(param_name: string, default_if_undefined: any = null): any {
        if (!param_name || !this.preload_params[param_name] || !this.preload_params[param_name].loaded) {
            return default_if_undefined;
        }

        return this.preload_params[param_name].value;
    }
}
