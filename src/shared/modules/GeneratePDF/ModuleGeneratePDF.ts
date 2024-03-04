import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import APIControllerWrapper from '../API/APIControllerWrapper';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import GeneratePdfParamVO, { GeneratePdfParamVOStatic } from './params/GeneratePdfParamVO';

export default class ModuleGeneratePDF extends Module {

    public static APINAME_generatePDF: string = "generatePDF";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleGeneratePDF {
        if (!ModuleGeneratePDF.instance) {
            ModuleGeneratePDF.instance = new ModuleGeneratePDF();
        }
        return ModuleGeneratePDF.instance;
    }

    private static instance: ModuleGeneratePDF = null;

    /**
     * Fonction de génération d'un PDF (ATTENTION: le logiciel wkhtmltopdf doit être installé sur l'ordinateur)
     * @param sous_rep Nom du Sous répertoire où doit être enregistré le PDF
     * @param file_name Nom du PDF avec extension
     * @param html Contenu HTML du PDF
     * @param save_to_desktop Forcer la sauvegarde sur l'ordinateur du client
     * @param options Options du PDF : default { encoding: 'utf-8' }
     */
    public generatePDF: (sous_rep: string, file_name: string, html: string, save_to_desktop: boolean, options?: {}) => Promise<string> = APIControllerWrapper.sah(ModuleGeneratePDF.APINAME_generatePDF);

    private constructor() {
        super("generate_pdf", 'GeneratePDF');
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<GeneratePdfParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleGeneratePDF.APINAME_generatePDF,
            [],
            GeneratePdfParamVOStatic
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }
}
