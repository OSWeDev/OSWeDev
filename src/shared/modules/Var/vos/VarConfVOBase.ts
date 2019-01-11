import INamedVO from '../../../interfaces/INamedVO';
import IParameterizedVO from '../../../interfaces/IParameterizedVO';

export default abstract class VarConfVOBase implements INamedVO, IParameterizedVO {

    public id: number;
    public abstract _type: string;

    public name: string;
    public group_id: number;

    /**
     * json_params : params au format json, à généraliser pour des paramètres dont on peut faire varier les attributs
     */
    public json_params: string;
}