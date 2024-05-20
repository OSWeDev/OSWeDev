import { FileObject, FileObjectsPage } from 'openai/resources';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFileVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleGPTServer from './ModuleGPTServer';
import { createReadStream } from 'fs';
import { Uploadable } from 'openai/uploads';
import { cloneDeep } from 'lodash';
import { AssistantCreateParams } from 'openai/resources/beta/assistants';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../shared/modules/DataRender/vos/NumSegment';
import GPTAssistantAPIToolResourcesVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIToolResourcesVO';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import RangeHandler from '../../../shared/tools/RangeHandler';
import ConfigurationService from '../../env/ConfigurationService';

export default class GPTAssistantAPIServerSyncFilesController {

    public static async from_openai_api(data: AssistantCreateParams.ToolResources): Promise<GPTAssistantAPIToolResourcesVO> {

        if (!data) {
            return null;
        }

        const res: GPTAssistantAPIToolResourcesVO = new GPTAssistantAPIToolResourcesVO();

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        if (data.code_interpreter) {
            res.code_interpreter_gpt_file_ids = cloneDeep(data.code_interpreter.file_ids);

            const code_interpreter_file_ids_ranges: NumRange[] = [];
            for (const i in res.code_interpreter_gpt_file_ids) {
                const gpt_file_id = res.code_interpreter_gpt_file_ids[i];

                await promise_pipeline.push(async () => {
                    const assistant_file = await GPTAssistantAPIServerSyncFilesController.get_file_or_sync(gpt_file_id);

                    if (!assistant_file) {
                        throw new Error('GPTAssistantAPIToolResourcesVO: file not found:' + gpt_file_id);
                    }

                    code_interpreter_file_ids_ranges.push(RangeHandler.create_single_elt_NumRange(assistant_file.id, NumSegment.TYPE_INT));
                });
            }
            res.code_interpreter_file_ids_ranges = code_interpreter_file_ids_ranges;
        }

        if (data.file_search) {
            res.file_search_gpt_vector_store_ids = cloneDeep(data.file_search.vector_store_ids);

            const file_search_vector_store_ids_ranges: NumRange[] = [];
            for (const i in res.file_search_gpt_vector_store_ids) {
                const gpt_vector_store_id = res.file_search_gpt_vector_store_ids[i];

                await promise_pipeline.push(async () => {
                    const vector_store_file = await GPTAssistantAPIServerSyncVectorStoresController.get_vector_store_or_sync(gpt_vector_store_id);

                    if (!vector_store_file) {
                        throw new Error('GPTAssistantAPIToolResourcesVO: vector store not found:' + gpt_vector_store_id);
                    }

                    file_search_vector_store_ids_ranges.push(RangeHandler.create_single_elt_NumRange(vector_store_file.id, NumSegment.TYPE_INT));
                });
            }
            res.file_search_vector_store_ids_ranges = file_search_vector_store_ids_ranges;
        }

        await promise_pipeline.end();

        return res;
    }

    public static async to_openai_api(vo: GPTAssistantAPIToolResourcesVO): Promise<AssistantCreateParams.ToolResources> {

        if (!vo) {
            return null;
        }

        const res: AssistantCreateParams.ToolResources = {};

        if (vo.code_interpreter_gpt_file_ids) {
            res.code_interpreter = {
                file_ids: cloneDeep(vo.code_interpreter_gpt_file_ids)
            };
        }

        if (vo.file_search_gpt_vector_store_ids) {
            res.file_search = {
                vector_store_ids: cloneDeep(vo.file_search_gpt_vector_store_ids)
            };
        }

        return res;
    }

    /**
     * à utiliser pour la création ou la mise à jour vers OpenAI
     * ATTENTION : peut initier une mise à jour du VO, car on récupère les champs de l'objet OpenAI après mise à jour ou création dans OpenAI
     * @param vo le vo à pousser vers OpenAI
     * @returns OpenAI obj
     */
    public static async push_file_to_openai(vo: GPTAssistantAPIFileVO): Promise<FileObject> {
        try {

            if (!vo) {
                throw new Error('No file_vo provided');
            }

            let gpt_obj: FileObject = vo.gpt_file_id ? await ModuleGPTServer.openai.files.retrieve(vo.gpt_file_id) : null;

            if (!gpt_obj) {
                gpt_obj = await ModuleGPTServer.openai.files.create({

                    file: createReadStream(vo.filename) as unknown as Uploadable,
                    purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating file in OpenAI');
                }
            } else {
                if ((vo.gpt_file_id != gpt_obj.id) ||
                    (vo.created_at != gpt_obj.created_at) ||
                    (vo.bytes != gpt_obj.bytes) ||
                    (vo.filename != gpt_obj.filename) ||
                    (vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose])) {

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les fichiers
                    // donc on supprime et on recrée
                    await ModuleGPTServer.openai.files.del(gpt_obj.id);

                    gpt_obj = await ModuleGPTServer.openai.files.create({

                        file: createReadStream(vo.filename) as unknown as Uploadable,
                        purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                    });

                    if (!gpt_obj) {
                        throw new Error('Error while creating file in OpenAI');
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if ((vo.gpt_file_id != gpt_obj.id) ||
                (vo.created_at != gpt_obj.created_at) ||
                (vo.bytes != gpt_obj.bytes) ||
                (vo.filename != gpt_obj.filename) ||
                (vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose])) {

                vo.gpt_file_id = gpt_obj.id;
                vo.created_at = gpt_obj.created_at;
                vo.bytes = gpt_obj.bytes;
                vo.filename = gpt_obj.filename;
                vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose];
                vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            throw error;
        }
    }

    /**
     * On récupère tous les fichiers de l'API GPT et on les synchronise avec Osélia
     *  Ce qui signifie créer dans Osélia les Files de GPT qui n'existent pas encore
     *  Archiver les fichiers d'Osélia qui n'existent plus dans GPT (et pas encore archivés dans Osélia)
     */
    public static async get_file_or_sync(gpt_file_id: string): Promise<GPTAssistantAPIFileVO> {
        let file = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        if (!file) {
            ConsoleHandler.warn('File not found : ' + gpt_file_id + ' - Syncing FileObjects');
            await GPTAssistantAPIServerSyncFilesController.sync_files();
        }

        file = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, gpt_file_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFileVO>();
        if (!file) {
            ConsoleHandler.error('File not found : ' + gpt_file_id + ' - Already tried to sync FileObjects - Aborting');
            throw new Error('File not found : ' + gpt_file_id + ' - Already tried to sync FileObjects - Aborting');
        }

        return file;
    }

    /**
     * On récupère tous les files de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_files() {
        const files: FileObject[] = await GPTAssistantAPIServerSyncFilesController.get_all_files();
        const files_vos: GPTAssistantAPIFileVO[] = await query(GPTAssistantAPIFileVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIFileVO>();
        const files_vos_by_gpt_id: { [gpt_file_id: string]: GPTAssistantAPIFileVO } = {};

        for (const i in files_vos) {
            const file_vo = files_vos[i];
            files_vos_by_gpt_id[file_vo.gpt_file_id] = file_vo;
        }

        for (const i in files) {
            const file = files[i];
            let found_vo: GPTAssistantAPIFileVO = files_vos_by_gpt_id[file.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIFileVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                (found_vo.gpt_file_id != file.id) ||
                (found_vo.created_at != file.created_at) ||
                (found_vo.bytes != file.bytes) ||
                (found_vo.filename != file.filename) ||
                (found_vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[file.purpose]);

            if (!needs_update) {
                continue;
            }

            found_vo.gpt_file_id = file.id;
            found_vo.created_at = file.created_at;
            found_vo.bytes = file.bytes;
            found_vo.filename = file.filename;
            found_vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[file.purpose];
            found_vo.archived = false;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // Les files qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_file_id in files_vos_by_gpt_id) {

            if (files_vos_by_gpt_id[gpt_file_id]) {
                continue;
            }

            const found_vo = files_vos_by_gpt_id[gpt_file_id];

            if (found_vo.archived) {
                continue;
            }

            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_files(): Promise<FileObject[]> {

        const res: FileObject[] = [];

        let files_page: FileObjectsPage = await ModuleGPTServer.openai.files.list();

        if (!files_page) {
            return res;
        }

        if (files_page.data && files_page.data.length) {
            res.concat(files_page.data);
        }

        while (files_page.hasNextPage()) {
            files_page = await files_page.getNextPage();
            res.concat(files_page.data);
        }

        return res;
    }
}