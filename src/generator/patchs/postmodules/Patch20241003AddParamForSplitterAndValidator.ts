import { IDatabase } from "pg-promise";
import OseliaRunServerController from "../../../server/modules/Oselia/OseliaRunServerController";
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
            OseliaRunServerController.PARAM_NAME_SPLITTER_PROMPT_PREFIX,
            '<Dans un premier temps, génère un plan d\'action en 1 ou plusieurs étapes (max 4), qui te serviront ensuite de prompts dans les prochains runs, pour répondre au mieux à cette demande. ' +
            'Le découpage doit être efficace, en utilisant le minimum d\'étapes pour répondre, et chaque étape doit être utile. Il est par exemple inutile de faire une étape pour se préparer à une demande à venir ou pour valider une étape (puisqu\'il existe un paramètre pour faire une validation automatique). ' +
            'Quand tu définis une étape, tu peux indiquer que l\'étape doit être validée. Dans ce cas, 2 runs seront lancés, 1 pour faire l\'action, et un second dans la foulée pour vérifier le résultat. ' +
            'Pour chaque étape tu dois définir un nom en moins de 50 caractères pour indiquer clairement ce que tu vas faire. ' +
            'Tu dois également définir si le prompt de l\'étape a une utilité à être affichée dans la discussion publiquement, ou si c\'est une étape intermédiaire dont le résultat est utile uniquement à ton raisonnement. ' +
            'Idem pour les outputs de l\'étape, si c\'est une étape intermédiaire, en indiquant true dans le paramètre hide_outputs, tu caches les outputs dans l\'interface, mais elles resteront visibles du point de vue de l\'assistant. ' +
            'Pour le moment tu ne dois fournir que le plan d\'action en appelant la fonction append_new_child_run_step pour chaque étape à réaliser. Cette fonction ne sera disponible que sur un run avec ce début de prompt. Par la suite tu ne pourras plus ajouter des étapes, sauf à être à nouveau sur une étape de génération de plan d\'action comme celle-ci>'
        );
        await ModuleParams.getInstance().setParamValue(
            OseliaRunServerController.PARAM_NAME_VALIDATOR_PROMPT_PREFIX,
            '<Tu dois maintenant valider que l\'on a bien les réponses au prompt suivant, et qu\'il n\'y a pas eu d\'hallucination de la part de l\'assistant. Tu dois vérifier que tout est bien justifié. ' +
            'Au besoin, si la justification d\'une information n\'est pas accessible ou tu as un doute, tu préfèrera refuser le run en posant une question qui te permettra au prochain run de faire un choix en valider et refuser. Par exemple, ' +
            'tu ne trouves pas dans les appels de fonctions ou dans les éléments disponibles dans la discussion, ou dans la discussion elle-même, le lien entre un nom et un code, ' +
            'mais pourtant ce lien est nécessaire pour justifier le message de l\'assistant. Dans ce cas, demande la source du lien ou de vérifier que ce lien est bien justifié. ' +
            'Si tu peux faire appel aux fonctions qui te permettraient d\'avoir les infos qui te manquent, tente de les appeler directement, et si après cela il te manque encore des infos, fait un bilan de ce que tu as fait et ce qu\'il te manque puis refuse pour avoir le complément. ' +
            'Si tu refuses, tu dois indiquer la raison, un nom pour le rerun qui sera lancé pour corriger avec tes retours, et un prompt pour ce nouveau run de l\'assistant. ' +
            'Tu ne peux pas refuser de faire une action, tu peux simplement refuser la réponse qui a déjà été formulée dans la discussion. Dans TOUS les cas tu dois OBLIGATOIREMENT appeler l\'une ou l\'autre fonction - validate_oselia_run ou refuse_oselia_run>'
        );

        await ModuleParams.getInstance().setParamValue(
            OseliaRunServerController.PARAM_NAME_STEP_OSELIA_PROMPT_PREFIX,
            '<Tu dois te limiter à cette étape> '
        );
    }
}