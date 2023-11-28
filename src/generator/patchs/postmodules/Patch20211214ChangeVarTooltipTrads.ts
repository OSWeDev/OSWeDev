/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';

export default class Patch20211214ChangeVarTooltipTrads implements IGeneratorWorker {

    public static getInstance(): Patch20211214ChangeVarTooltipTrads {
        if (!Patch20211214ChangeVarTooltipTrads.instance) {
            Patch20211214ChangeVarTooltipTrads.instance = new Patch20211214ChangeVarTooltipTrads();
        }
        return Patch20211214ChangeVarTooltipTrads.instance;
    }

    private static instance: Patch20211214ChangeVarTooltipTrads = null;

    get uid(): string {
        return 'Patch20211214ChangeVarTooltipTrads';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        let lang = await ModuleTranslation.getInstance().getLang('fr-fr');
        let text = await ModuleTranslation.getInstance().getTranslatableText("VarDataRefComponent.var_data_value_import_tooltip.___LABEL___");

        if ((!lang) || (!text)) {
            return;
        }

        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);

        if (!translation) {
            return;
        }

        translation.translated = "<li>Import ou saisie le <b>{formatted_date}</b><br><i>{value}</i></li>";
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translation);
    }
}