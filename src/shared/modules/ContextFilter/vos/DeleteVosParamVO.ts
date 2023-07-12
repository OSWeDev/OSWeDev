/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import ContextQueryVO from "./ContextQueryVO";

export default class DeleteVosParamVO implements IAPIParamTranslator<DeleteVosParamVO> {

    public static fromParams(
        context_query: ContextQueryVO
    ): DeleteVosParamVO {

        return new DeleteVosParamVO(
            context_query
        );
    }

    public static getAPIParams(param: DeleteVosParamVO): any[] {
        return [
            param.context_query
        ];
    }

    public constructor(
        public context_query: ContextQueryVO
    ) {
    }
}

export const DeleteVosParamVOStatic: IAPIParamTranslatorStatic<DeleteVosParamVO> = DeleteVosParamVO;