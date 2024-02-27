/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DashboardBuilderController from '../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../shared/modules/VO/manager/VOsTypesManager';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20221216ChangeDbbTradsToIncludeLabels implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20221216ChangeDbbTradsToIncludeLabels {
        if (!Patch20221216ChangeDbbTradsToIncludeLabels.instance) {
            Patch20221216ChangeDbbTradsToIncludeLabels.instance = new Patch20221216ChangeDbbTradsToIncludeLabels();
        }
        return Patch20221216ChangeDbbTradsToIncludeLabels.instance;
    }

    private static instance: Patch20221216ChangeDbbTradsToIncludeLabels = null;

    get uid(): string {
        return 'Patch20221216ChangeDbbTradsToIncludeLabels';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        const codes = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_starting_with('code_text', DashboardBuilderController.PAGE_NAME_CODE_PREFIX).select_vos<TranslatableTextVO>();
        const full_name = ModuleTableController.module_tables_by_vo_type[TranslatableTextVO.API_TYPE_ID].full_name;

        for (const i in codes) {
            const code = codes[i];

            if (code.code_text.indexOf('.___LABEL___') > -1) {
                continue;
            }

            await db.query('UPDATE ' + full_name + ' set code_text = $1 where id = $2', [code.code_text + '.___LABEL___', code.id]);
        }
    }
}