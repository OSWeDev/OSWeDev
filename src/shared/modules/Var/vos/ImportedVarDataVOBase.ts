import IDistantVOBase from '../../IDistantVOBase';
import VarDataParamVOBase from './VarDataParamVOBase';

export default abstract class ImportedVarDataVOBase extends VarDataParamVOBase implements IDistantVOBase {

    public id: number;
    public abstract _type: string;

    /**
     * La data importée hérite directement du dataParam correspondant, qui contient les infos nécessaires pour définir
     *  la provenance de cette valeur importée
     * public var_group_id: number;
     * public json_params: string;
     */

    public imported_value: number;
}