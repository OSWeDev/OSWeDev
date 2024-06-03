import { Run } from "openai/resources/beta/threads/runs/runs";
import { RunStep } from "openai/resources/beta/threads/runs/steps";
import { VectorStoreFile } from "openai/resources/beta/vector-stores/files";
import GPTAssistantAPIErrorVO from "../../../../shared/modules/GPT/vos/GPTAssistantAPIErrorVO";
import GPTAssistantAPIServerSyncAssistantsController from "./GPTAssistantAPIServerSyncAssistantsController";
import GPTAssistantAPIServerSyncFilesController from "./GPTAssistantAPIServerSyncFilesController";
import GPTAssistantAPIServerSyncThreadsController from "./GPTAssistantAPIServerSyncThreadsController";
import GPTAssistantAPIServerSyncVectorStoresController from "./GPTAssistantAPIServerSyncVectorStoresController";

export default class GPTAssistantAPIServerSyncController {

    public static async sync_all_datas(): Promise<void> {

        await GPTAssistantAPIServerSyncAssistantsController.sync_assistants();
        await GPTAssistantAPIServerSyncFilesController.sync_files();
        await GPTAssistantAPIServerSyncThreadsController.sync_threads();
        await GPTAssistantAPIServerSyncVectorStoresController.sync_vector_stores();
    }

    public static from_openai_error(gpt_obj: Run.LastError | RunStep.LastError | VectorStoreFile.LastError): GPTAssistantAPIErrorVO {

        if (!gpt_obj) {
            return null;
        }

        const res: GPTAssistantAPIErrorVO = new GPTAssistantAPIErrorVO();

        res.code = GPTAssistantAPIErrorVO.FROM_OPENAI_CODE_MAP[gpt_obj.code];
        res.message = gpt_obj.message;

        return res;
    }

    public static to_openai_error(vo: GPTAssistantAPIErrorVO): Run.LastError | RunStep.LastError | VectorStoreFile.LastError {

        if (!vo) {
            return null;
        }

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: GPTAssistantAPIErrorVO.TO_OPENAI_CODE_MAP[vo.code] as any,
            message: vo.message,
        };
    }

    /**
     * Pour identifier l'équivalence (et non l'égalité stricte) entre les valeurs issues de l'API GPT et les valeurs que nous avons en base (pour éviter de faire des mises à jour inutiles)
     * @param oswedev_value notre valeur
     * @param gpt_value la valeur issue de l'API GPT
     * @returns true si les valeurs sont équivalentes, false sinon
     */
    public static compare_values<A>(oswedev_value: A, gpt_value: A): boolean {
        if (oswedev_value == null) {
            return (gpt_value == null) || (gpt_value == '{}') ||
                ((typeof gpt_value == 'object') && (Object.keys(gpt_value).length == 0)) ||
                ((typeof gpt_value == 'string') && (gpt_value == '')); // On considère que les {} sont équivalents à des null côté GPT
        }

        if (gpt_value == null) {
            return false;
        }

        if (Array.isArray(gpt_value)) {
            if (!Array.isArray(oswedev_value)) {
                return false;
            }

            if (gpt_value.length != oswedev_value.length) {
                return false;
            }

            for (const i in gpt_value) {
                if (!GPTAssistantAPIServerSyncController.compare_values(oswedev_value[i], gpt_value[i])) {
                    return false;
                }
            }

            return true;
        }

        if (((typeof gpt_value === 'object') && (gpt_value !== null)) || (typeof gpt_value === 'function')) {
            if (!(((typeof oswedev_value === 'object') && (oswedev_value !== null)) || (typeof oswedev_value === 'function'))) {
                return false;
            }

            if (Object.keys(gpt_value).length != Object.keys(oswedev_value).length) {
                return false;
            }

            for (const key in gpt_value) {
                if (!GPTAssistantAPIServerSyncController.compare_values(oswedev_value[key], gpt_value[key])) {
                    return false;
                }
            }

            return true;
        }

        return gpt_value == oswedev_value;
    }
}