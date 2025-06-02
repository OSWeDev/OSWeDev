/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import SuperviseurAssistantTraductionServerController from '../../../server/modules/Translation/SuperviseurAssistantTraductionServerController';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction implements IGeneratorWorker {

    private static instance: Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction {
        if (!Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction.instance) {
            Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction.instance = new Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction();
        }
        return Patch20250512OSELIA_ActivateFunction_getLangs_OnAssistant_SuperviseurTraduction.instance;
    }


    public async work(db: IDatabase<any>) {

        const assistant_superviseur: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, SuperviseurAssistantTraductionServerController.OSELIA_superviseur_assistant_traduction_ASSISTANT_NAME)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();
        if (!assistant_superviseur) {
            throw new Error("assistant_superviseur not found");
        }

        await ModuleOseliaServer.getInstance().add_function_to_assistant(
            assistant_superviseur,
            ModuleTranslationServer.getInstance().name,
            reflect<ModuleTranslationServer>().getLangs,
        );
    }
}