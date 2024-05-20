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
        await GPTAssistantAPIServerSyncVectorStoresController.sync_vector_store_files();
        await GPTAssistantAPIServerSyncVectorStoresController.sync_vector_store_file_batches();
    }
}