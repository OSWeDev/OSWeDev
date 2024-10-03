import { IDatabase } from "pg-promise";
import OseliaServerController from "../../../server/modules/Oselia/OseliaServerController";
import ModuleParams from "../../../shared/modules/Params/ModuleParams";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20241003AddParamForSplitterAndValidator implements IGeneratorWorker {

    private static instance: Patch20241003AddParamForSplitterAndValidator = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241003AddParamForSplitterAndValidator';
    }

    public static getInstance(): Patch20241003AddParamForSplitterAndValidator {
        if (!Patch20241003AddParamForSplitterAndValidator.instance) {
            Patch20241003AddParamForSplitterAndValidator.instance = new Patch20241003AddParamForSplitterAndValidator();
        }
        return Patch20241003AddParamForSplitterAndValidator.instance;
    }

    public async work(db: IDatabase<unknown>) {
        await ModuleParams.getInstance().setParamValue(
            OseliaServerController.PARAM_NAME_SPLITTER_PROMPT_PREFIX,
            '<Dans un premier temps, génère un plan d\'action en 1 ou plusieurs étapes (max 4), qui te serviront ensuite de prompts dans les prochains runs, pour répondre au mieux à cette demande. ' +
            'Le découpage doit être efficace, en utilisant le minimum d\'étapes pour répondre, et chaque étape doit être utile. Il est par exemple inutile de faire une étape pour se préparer à une demande à venir. ' +
            'Quand tu définis une étape, tu peux indiquer que l\'étape doit être validée. Dans ce cas, 2 runs seront lancés, 1 pour faire l\'action, et un second dans la foulée pour vérifier le résultat. ' +
            'Pour chaque étape tu dois définir un nom en moins de 50 caractères pour indiquer clairement ce que tu vas faire. ' +
            'Tu dois également définir si le prompt de l\'étape a une utilité à être affichée dans la discussion publiquement, ou si c\'est une étape intermédiaire dont le résultat est utile uniquement à ton raisonnement. ' +
            'Idem pour les outputs de l\'étape, si c\'est une étape intermédiaire, en indiquant true dans le paramètre hide_outputs, tu caches les outputs dans l\'interface, mais elles resteront visibles du point de vue de l\'assistant. ' +
            'Pour le moment tu ne dois fournir que le plan d\'action en appelant la fonction internal_splitter pour chaque étape à réaliser>'
        );
        await ModuleParams.getInstance().setParamValue(
            OseliaServerController.PARAM_NAME_VALIDATOR_PROMPT_PREFIX,
            '<Tu dois maintenant valider que l\'on a bien les réponses au prompt suivant, et qu\'il n\'y a pas eu d\'hallucination de la part de l\'assistant>'
        );
    }
}