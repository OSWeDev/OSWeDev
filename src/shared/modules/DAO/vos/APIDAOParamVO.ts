/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IRange from '../../DataRender/interfaces/IRange';

export default class APIDAOParamVO implements IAPIParamTranslator<APIDAOParamVO> {

    public static URL: string = ':api_type_id/:id';

    public static fromREQ(req): APIDAOParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new APIDAOParamVO(req.params.api_type_id, parseInt(req.params.id));
    }

    public static fromParams(API_TYPE_ID: string, id: number, segmentation_ranges: IRange[] = null): APIDAOParamVO {
        return new APIDAOParamVO(API_TYPE_ID, id, segmentation_ranges);
    }

    public static getAPIParams(param: APIDAOParamVO): any[] {
        return [param.API_TYPE_ID, param.id, param.segmentation_ranges];
    }

    public constructor(
        public API_TYPE_ID: string,
        public id: number,
        public segmentation_ranges: IRange[] = null) {
    }

    public translateToURL(): string {
        return this.API_TYPE_ID + '/' + this.id;
    }
}

export const APIDAOParamVOStatic: IAPIParamTranslatorStatic<APIDAOParamVO> = APIDAOParamVO;