import { IDatabase } from "pg-promise";
import ModuleDAO from "../../../shared/modules/DAO/ModuleDAO";
import DocumentVO from "../../../shared/modules/Document/vos/DocumentVO";
import IGeneratorWorker from "../../IGeneratorWorker";

export default class Patch20210305affichageIconePDF implements IGeneratorWorker {

    public static getInstance(): Patch20210305affichageIconePDF {
        if (!Patch20210305affichageIconePDF.instance) {
            Patch20210305affichageIconePDF.instance = new Patch20210305affichageIconePDF();
        }
        return Patch20210305affichageIconePDF.instance;
    }

    private static instance: Patch20210305affichageIconePDF = null;

    get uid(): string {
        return 'Patch20210305affichageIconePDF';
    }

    private constructor() { }

    /**
     * Objectif : attribuer show_icon à false pour les fichiers dont on ne veut pas afficher l'icone
     */
    public async work(db: IDatabase<any>) {

        try {
            let docs: DocumentVO[] = await ModuleDAO.getInstance().getVos<DocumentVO>(DocumentVO.API_TYPE_ID);

            if (docs.every((doc) => doc.type == DocumentVO.DOCUMENT_TYPE_PDF)) {

                docs.forEach(
                    (doc) => { doc.show_icon = false; });

                await ModuleDAO.getInstance().insertOrUpdateVOs(docs);
            }

        } catch (error) { }

    }
}