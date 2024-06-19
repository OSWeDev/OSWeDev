/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240619DeclareFunctionOseliaGenerateImages implements IGeneratorWorker {

    private static instance: Patch20240619DeclareFunctionOseliaGenerateImages = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240619DeclareFunctionOseliaGenerateImages';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240619DeclareFunctionOseliaGenerateImages {
        if (!Patch20240619DeclareFunctionOseliaGenerateImages.instance) {
            Patch20240619DeclareFunctionOseliaGenerateImages.instance = new Patch20240619DeclareFunctionOseliaGenerateImages();
        }
        return Patch20240619DeclareFunctionOseliaGenerateImages.instance;
    }

    public async work(db: IDatabase<any>) {

        let fonction_generate_images = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, reflect<ModuleOselia>().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().generate_images)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!fonction_generate_images) {
            fonction_generate_images = new GPTAssistantAPIFunctionVO();

            fonction_generate_images.archived = false;
            fonction_generate_images.module_function = reflect<ModuleOseliaServer>().generate_images;
            fonction_generate_images.module_name = ModuleOselia.getInstance().name;
            fonction_generate_images.prepend_thread_vo = true;
            fonction_generate_images.gpt_function_name = reflect<ModuleOseliaServer>().generate_images;
            fonction_generate_images.gpt_function_description = "Cette fonction te permet de demander la génération d'une ou plusieurs images à l'API openai.images.generate. Les images résultantes sont affichées automatiquement à l'utilisateur avec lequel tu es en conversation. Attention avec le model dall-e-3 tu ne dois pas utiliser de taille < 1024.";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(fonction_generate_images);


            const argument_target_id = new GPTAssistantAPIFunctionParamVO();
            argument_target_id.archived = false;
            argument_target_id.function_id = fonction_generate_images.id;
            argument_target_id.gpt_funcparam_description = "le model à utiliser parmis ceux proposés par OpenAI. A priori toujours utiliser 'dall-e-3' sauf demande explicite.";
            argument_target_id.gpt_funcparam_name = "model";
            argument_target_id.required = true;
            argument_target_id.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_target_id.string_enum = ["dall-e-2", "dall-e-3"]
            argument_target_id.weight = 1;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_target_id);
            const argument_degre_certitude = new GPTAssistantAPIFunctionParamVO();
            argument_degre_certitude.archived = false;
            argument_degre_certitude.function_id = fonction_generate_images.id;
            argument_degre_certitude.gpt_funcparam_description = "Le prompt qui va servir à générer l'image.";
            argument_degre_certitude.gpt_funcparam_name = "prompt";
            argument_degre_certitude.required = true;
            argument_degre_certitude.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_degre_certitude.weight = 2;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_degre_certitude);
            const argument_size = new GPTAssistantAPIFunctionParamVO();
            argument_size.archived = false;
            argument_size.function_id = fonction_generate_images.id;
            argument_size.gpt_funcparam_description = "La taille de l'image à choisir dans les options disponibles. Se référer à la doc OpenAI pour les tailles disponibles pour chaque modèle. Pour Dall-e-3 n'utilise pas de dimension < 1024.";
            argument_size.gpt_funcparam_name = "size";
            argument_size.required = true;
            argument_size.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_size.weight = 3;
            argument_size.string_enum = ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"];
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_size);
            const argument_n = new GPTAssistantAPIFunctionParamVO();
            argument_n.archived = false;
            argument_n.function_id = fonction_generate_images.id;
            argument_n.gpt_funcparam_description = "Nombre d'images à générer. Par défaut 1, mais il est souvent pertinent de décider de proposer plusieurs solutions différentes. Peut-être plutôt en appelant plusieurs fois la génération d'une image avec des variantes de prompt, plutôt que 4 variantes issues du même prompt... On a limité à 10, tu peux communiquer cette limite à l'utilisateur si c'est pertinent.";
            argument_n.gpt_funcparam_name = "n";
            argument_n.required = true;
            argument_n.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_n.number_enum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // On limite à 10 pour ne pas surcharger l'API
            argument_n.weight = 4;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_n);
        }
    }
}