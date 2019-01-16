import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';

export default abstract class VarDataParamControllerBase<TDataParam extends IVarDataParamVOBase> {

    protected constructor() { }

    public sortParams(params: IVarDataParamVOBase[]) {
        params.sort(this.compareParams);
    }

    /**
     * @returns Index for HashMaps. ID uniq for each possible configuration
     */
    public getIndex(param: TDataParam): string {

        let res: string = "";

        res += param.var_group_id;

        if ((!!param.json_params) && (param.json_params != "")) {
            res += "__" + param.json_params.replace(/[^0-9a-zA-Z-_]/ig, '_');
        }

        for (let i in param) {
            let val: string = param[i].toString();

            if ((i == 'var_group_id') || (i == 'json_params') || (i == 'id') || (i == '_type')) {
                continue;
            }

            if (!val) {
                res += "____";
                continue;
            }

            res += "__" + val + "__";
        }

        return res;
    }

    protected abstract compareParams(paramA: IVarDataParamVOBase, paramB: IVarDataParamVOBase);
}