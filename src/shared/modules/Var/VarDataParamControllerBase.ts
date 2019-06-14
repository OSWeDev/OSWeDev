import ObjectHandler from '../../tools/ObjectHandler';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';

export default abstract class VarDataParamControllerBase<TDataParam extends IVarDataParamVOBase> {

    protected constructor() { }

    // public sortParams(params: { [index: string]: IVarDataParamVOBase }) {
    //     ObjectHandler.getInstance().sortObjectByKey(params, this.compareParams);
    // }

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

    /**
     * La fonction inverse
     * @param param_index
     */
    // public abstract getParam(param_index: string): TDataParam;

    public abstract getImpactedParamsList(paramUpdated: TDataParam, paramsRegisteredByIndex: { [index: string]: IVarDataParamVOBase }): TDataParam[];

    // protected abstract compareParams(paramA: TDataParam, paramB: TDataParam);
}