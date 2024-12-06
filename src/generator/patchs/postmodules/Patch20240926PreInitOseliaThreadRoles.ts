import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import RangeHandler from '../../../shared/tools/RangeHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import OseliaThreadRoleVO from '../../../shared/modules/Oselia/vos/OseliaThreadRoleVO';
import ModuleOselia from '../../../shared/modules/Oselia/ModuleOselia';

export default class Patch20240926PreInitOseliaThreadRoles implements IGeneratorWorker {

    private static instance: Patch20240926PreInitOseliaThreadRoles = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20240926PreInitOseliaThreadRoles';
    }

    public static getInstance(): Patch20240926PreInitOseliaThreadRoles {
        if (!Patch20240926PreInitOseliaThreadRoles.instance) {
            Patch20240926PreInitOseliaThreadRoles.instance = new Patch20240926PreInitOseliaThreadRoles();
        }
        return Patch20240926PreInitOseliaThreadRoles.instance;
    }

    public async work(db: IDatabase<unknown>) {

        // Rôle propriétaire
        const role_proprietaire = new OseliaThreadRoleVO();
        role_proprietaire.translatable_name = ModuleOselia.ROLE_OWNER;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(role_proprietaire);

        // Rôle propriétaire
        const role_user = new OseliaThreadRoleVO();
        role_user.translatable_name = ModuleOselia.ROLE_USER;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(role_user);

    }
}