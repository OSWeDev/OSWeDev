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

        const res: GPTAssistantAPIErrorVO = new GPTAssistantAPIErrorVO();

        res.code = GPTAssistantAPIErrorVO.FROM_OPENAI_CODE_MAP[gpt_obj.code];
        res.message = gpt_obj.message;

        return res;
    }

    public static to_openai_error(vo: GPTAssistantAPIErrorVO): Run.LastError | RunStep.LastError | VectorStoreFile.LastError {

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: GPTAssistantAPIErrorVO.TO_OPENAI_CODE_MAP[vo.code] as any,
            message: vo.message,
        };
    }
}