import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import TranslatableTextVO from "../../../shared/modules/Translation/vos/TranslatableTextVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250425RenameTradsMenuCMS implements IGeneratorWorker {

    private static instance: Patch20250425RenameTradsMenuCMS = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250425RenameTradsMenuCMS';
    }

    public static getInstance(): Patch20250425RenameTradsMenuCMS {
        if (!Patch20250425RenameTradsMenuCMS.instance) {
            Patch20250425RenameTradsMenuCMS.instance = new Patch20250425RenameTradsMenuCMS();
        }
        return Patch20250425RenameTradsMenuCMS.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const vos = await query(TranslatableTextVO.API_TYPE_ID)
            .filter_by_text_starting_with(field_names<TranslatableTextVO>().code_text, 'cms__menu__')
            .exec_as_server()
            .select_vos<TranslatableTextVO>();

        for (const i in vos) {
            const vo = vos[i];
            vo.code_text = vo.code_text.replace('cms__menu__', 'dashboard__menu__');
        }

        await ModuleDAOServer.instance.insertOrUpdateVOs_as_server(vos);
    }
}