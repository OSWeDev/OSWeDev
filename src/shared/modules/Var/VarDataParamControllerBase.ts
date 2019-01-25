import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import ObjectHandler from '../../tools/ObjectHandler';

export default abstract class VarDataParamControllerBase<TDataParam extends IVarDataParamVOBase> {

    protected constructor() { }

    public sortParams(params: { [index: string]: IVarDataParamVOBase }) {
        ObjectHandler.getInstance().sortObjectByKey(params, this.compareParams);
    }

    /**
     * TODO : si on avait un lien propre vers la description des types de données liées
     *  aux compteurs et données associées, on pourrait théoriquement chercher la defs des fields
     *  du type param associé à la donnée en param (qui peut être une data ou un param), puis lister
     *  les champs et construire un index générique pour toutes les vars. en l'état on a pas ça, donc on passe en abstract
     * @returns Index for HashMaps. ID uniq for each possible configuration
     */
    public abstract getIndex(param: TDataParam): string;
    // public getIndex(param: TDataParam): string {

    //     let res: string = "";

    //     res += param.var_id;

    //     if ((!!param.json_params) && (param.json_params != "")) {
    //         res += "__" + param.json_params.replace(/[^0-9a-zA-Z-_]/ig, '_');
    //     }

    //     for (let i in param) {
    //         if ((i == 'var_id') || (i == 'json_params') || (i == 'id') || (i == '_type')) {
    //             continue;
    //         }

    //         let val: string = param[i] ? param[i].toString() : null;

    //         if (!val) {
    //             res += "____";
    //             continue;
    //         }

    //         res += "__" + val + "__";
    //     }

    //     return res;
    // }

    public abstract getImpactedParamsList(paramUpdated: TDataParam, paramsRegisteredByIndex: { [index: string]: TDataParam }): TDataParam[];

    protected abstract compareParams(paramA: TDataParam, paramB: TDataParam);
}