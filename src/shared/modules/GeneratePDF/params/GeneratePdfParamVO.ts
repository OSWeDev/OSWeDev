export default class GeneratePdfParamVO {

    public static URL: string = ':sous_rep/:file_name/:text';
    public static reppath: string = "./files";
    public static filepath: string = "/PDF/";

    public static async translateCheckAccessParams(sous_rep: string, file_name: string, text: string, options: {}): Promise<GeneratePdfParamVO> {
        return new GeneratePdfParamVO(sous_rep, file_name, text, options);
    }

    public static async translateToURL(param: GeneratePdfParamVO): Promise<string> {
        return param ? (param.sous_rep + '/' + param.file_name + '/' + param.text + '/' + param.options) : '';
    }

    public static async translateFromREQ(req): Promise<GeneratePdfParamVO> {
        if (!(req && req.params)) {
            return null;
        }

        return new GeneratePdfParamVO(req.params.sous_rep, req.params.file_name, req.params.text, req.params.options);
    }

    public constructor(
        public sous_rep: string,
        public file_name: string,
        public text: string,
        public options: {},
    ) { }
}