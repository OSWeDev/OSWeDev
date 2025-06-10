/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class GeneratePdfParamVO implements IAPIParamTranslator<GeneratePdfParamVO> {

    public static reppath: string = "./files";
    public static filepath: string = "/PDF/";

    public static URL: string = ':sous_rep/:file_name/:text';

    public static fromREQ(req): GeneratePdfParamVO {
        if (!(req && req.params)) {
            return null;
        }

        return new GeneratePdfParamVO(req.params.sous_rep, req.params.file_name, req.params.text, req.params.options);
    }

    public static fromParams(
        sous_rep: string,
        file_name: string,
        html: string,
        options: any): GeneratePdfParamVO {

        return new GeneratePdfParamVO(sous_rep, file_name, html, options);
    }

    public static getAPIParams(param: GeneratePdfParamVO): any[] {
        return [param.sous_rep, param.file_name, param.html, param.options];
    }

    public constructor(
        public sous_rep: string,
        public file_name: string,
        public html: string,
        public options: any,
    ) { }

    public translateToURL(): string {
        return this.sous_rep + '/' + this.file_name + '/' + this.html + '/' + this.options;
    }
}

export const GeneratePdfParamVOStatic: IAPIParamTranslatorStatic<GeneratePdfParamVO> = GeneratePdfParamVO;