/* istanbul ignore file : nothing to test in ParamVOs */

import UserVO from "../../../AccessPolicy/vos/UserVO";
import GPTAssistantAPIThreadVO from "../../../GPT/vos/GPTAssistantAPIThreadVO";
import IAPIParamTranslator from "../../interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../interfaces/IAPIParamTranslatorStatic";

export default class UserParamVO implements IAPIParamTranslator<UserParamVO> {

    public constructor(
        public asking_user: UserVO,
        public thread: GPTAssistantAPIThreadVO
    ) { }

    public static fromParams(
        asking_user: UserVO,
        thread: GPTAssistantAPIThreadVO
    ): UserParamVO {

        return new UserParamVO(
            asking_user,
            thread
        );
    }

    public static getAPIParams(param: UserParamVO): any[] {
        return [
            param.asking_user,
            param.thread
        ];
    }
}

export const UserParamStatic: IAPIParamTranslatorStatic<UserParamVO> = UserParamVO;
