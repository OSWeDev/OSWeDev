import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import StatClientWrapperVO from "../vos/StatClientWrapperVO";

export default class RegisterClientStatsParamVO implements IAPIParamTranslator<RegisterClientStatsParamVO> {

    public static fromParams(stats_client: StatClientWrapperVO[], client_timestamp: number): RegisterClientStatsParamVO {

        return new RegisterClientStatsParamVO(stats_client, client_timestamp);
    }

    public static getAPIParams(param: RegisterClientStatsParamVO): any[] {
        return [param.stats_client, param.client_timestamp];
    }

    public constructor(
        public stats_client: StatClientWrapperVO[],
        public client_timestamp: number) {
    }
}

export const RegisterClientStatsParamVOStatic: IAPIParamTranslatorStatic<RegisterClientStatsParamVO> = RegisterClientStatsParamVO;