import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class PwaPushNotificationParam implements IAPIParamTranslator<PwaPushNotificationParam> {

    public constructor(
        public user_id: number,
        public message: string,
        public url: string,
    ) { }

    public static fromParams(
        user_id: number,
        message: string,
        url: string,
    ): PwaPushNotificationParam {
        return new PwaPushNotificationParam(
            user_id,
            message,
            url,
        );
    }

    public static getAPIParams(param: PwaPushNotificationParam): any[] {
        return [
            param.user_id,
            param.message,
            param.url,
        ];
    }
}

export const PwaPushNotificationParamStatic: IAPIParamTranslatorStatic<PwaPushNotificationParam> = PwaPushNotificationParam;