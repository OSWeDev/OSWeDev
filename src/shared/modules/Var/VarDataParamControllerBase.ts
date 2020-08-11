import ObjectHandler from '../../tools/ObjectHandler';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';

export default abstract class VarDataParamControllerBase<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    // TODO FIXME
    public param_desc_component = null;

    protected constructor() { }

    public abstract cloneParam(param: TDataParam): TDataParam;

    /**
     * DO NOT USE outside VarsController. There are controls made by VarsController.getInstance().getIndex() that this function depends on.
     * Use VarsController.getInstance().getIndex() instead in most cases.
     *
     * TODO : si on avait un lien propre vers la description des types de données liées
     *  aux compteurs et données associées, on pourrait théoriquement chercher la defs des fields
     *  du type param associé à la donnée en param (qui peut être une data ou un param), puis lister
     *  les champs et construire un index générique pour toutes les vars. en l'état on a pas ça, donc on passe en abstract
     *
     * ATTENTION : Il faut ABSOLUMENT que l'index soit unique sur l'ensemble des vars, donc on impose de commencer par param.var_id + "_" systématiquement
     *
     * @returns Index for HashMaps. ID uniq for each possible configuration
     */
    public abstract getIndex(param: TDataParam): string;
}