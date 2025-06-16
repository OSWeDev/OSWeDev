/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class EventParamVO implements IAPIParamTranslator<EventParamVO> {

    public constructor(
        public client_tab_id: string,
        public event_name: string,
        public event_param?: string,
    ) { }

    public static fromParams(
        client_tab_id: string,
        event_name: string,
        event_param?: string
    ): EventParamVO {

        return new EventParamVO(
            client_tab_id,
            event_name,
            event_param
        );
    }

    public static getAPIParams(param: EventParamVO): any[] {
        return [
            param.client_tab_id,
            param.event_name,
            param.event_param
        ];
    }
}

export const EventParamStatic: IAPIParamTranslatorStatic<EventParamVO> = EventParamVO;