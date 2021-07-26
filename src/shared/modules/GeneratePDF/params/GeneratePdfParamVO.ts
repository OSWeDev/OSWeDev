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
        save_to_desktop: boolean,
        options: {} = { encoding: 'utf-8' }): GeneratePdfParamVO {

        return new GeneratePdfParamVO(sous_rep, file_name, html, save_to_desktop, options);
    }

    public static getAPIParams(param: GeneratePdfParamVO): any[] {
        return [param.sous_rep, param.file_name, param.html, param.save_to_desktop, param.options];
    }

    public constructor(
        public sous_rep: string,
        public file_name: string,
        public html: string,
        public save_to_desktop: boolean,
        public options: {} = { encoding: 'utf-8' },
    ) { }

    public translateToURL(): string {
        return this.sous_rep + '/' + this.file_name + '/' + this.html + '/' + this.options;
    }
}

export const GeneratePdfParamVOStatic: IAPIParamTranslatorStatic<GeneratePdfParamVO> = GeneratePdfParamVO;