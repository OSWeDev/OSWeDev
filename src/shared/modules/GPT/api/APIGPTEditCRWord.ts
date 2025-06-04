/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IPlanRDVCR from '../../ProgramPlan/interfaces/IPlanRDVCR';

export default class APIGPTEditCRWord implements IAPIParamTranslator<APIGPTEditCRWord> {

    public constructor(
        public new_content: string,
        public section: string,
        public cr_vo: IPlanRDVCR,
        public cr_field_titles: string[],
    ) { }

    public static fromParams(
        new_content: string,
        section: string,
        cr_vo: IPlanRDVCR,
        cr_field_titles: string[],
    ): APIGPTEditCRWord {

        return new APIGPTEditCRWord(
            new_content,
            section,
            cr_vo,
            cr_field_titles,
        );
    }

    public static getAPIParams(param: APIGPTEditCRWord): any[] {
        return [
            param.new_content,
            param.section,
            param.cr_vo,
            param.cr_field_titles,
        ];
    }
}

export const APIGPTEditCRWordStatic: IAPIParamTranslatorStatic<APIGPTEditCRWord> = APIGPTEditCRWord;