import IDistantVOBase from '../../IDistantVOBase';
import IVarDataVOBase from '../../Var/interfaces/IVarDataVOBase';

export default interface IDataSourceController<TData extends IVarDataVOBase> {

    name: string;

    /**
     * Déclarer un datasource utilisable côté serveur
     */
    can_use_server_side: boolean;

    /**
     * Déclarer une datasource utilisable côté client
     */
    can_use_client_side: boolean;

    /**
     * Les api_type_ids qui engendrent un refresh potentiel du cache
     */
    vo_api_type_ids: string[];

    load_for_batch(vars_params: { [index: string]: TData }): Promise<void>;

    get_data(param: TData): any;

    get_updated_params_from_vo_update(vo: IDistantVOBase): { [index: string]: IVarDataVOBase };

    registerDataSource();
}