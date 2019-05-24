import IDistantVOBase from '../../../IDistantVOBase';


export default class ImportTranslation implements IDistantVOBase {

    public static API_TYPE_ID: string = "import_translation";

    public id: number;
    public _type: string = ImportTranslation.API_TYPE_ID;

    public code_lang: string;
    public code_text: string;
    public translated: string;
}
