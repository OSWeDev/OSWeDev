/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";


export default class AzureConnectCallbackParamVO implements IAPIParamTranslator<AzureConnectCallbackParamVO> {

    public static URL: string = ':state/:code';

    public static fromREQ(req): AzureConnectCallbackParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new AzureConnectCallbackParamVO(req.params.state, req.params.code);
    }

    public static fromParams(state: string, code: string): AzureConnectCallbackParamVO {
        return new AzureConnectCallbackParamVO(state, code);
    }

    public static getAPIParams(param: AzureConnectCallbackParamVO): any[] {
        return [param.state, param.code];
    }

    public constructor(
        public state: string,
        public code: string) {
    }

    public translateToURL(): string {

        return this.state + "/" + this.code;
    }
}

export const AzureConnectCallbackParamVOStatic: IAPIParamTranslatorStatic<AzureConnectCallbackParamVO> = AzureConnectCallbackParamVO;