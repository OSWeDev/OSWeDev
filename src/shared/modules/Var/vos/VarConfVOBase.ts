import INamedVO from '../../../interfaces/INamedVO';
import IParameterizedVO from '../../../interfaces/IParameterizedVO';

export default abstract class VarConfVOBase implements INamedVO, IParameterizedVO {

    public id: number;
    public abstract _type: string;

    public name: string;

    public var_data_vo_type: string;
    public var_imported_data_vo_type: string;

    /**
     * json_params : params au format json, à généraliser pour des paramètres dont on peut faire varier les attributs
     */
    public json_params: string;

    /**
     * Code de traduction du nom de la variable pour le DescMode
     */
    public translatable_name?: string;
    /**
     * Code de traduction de la description de la variable pour le DescMode
     */
    public translatable_description?: string;
    /**
     * Code de traduction de la description des params pour le DescMode
     */
    public translatable_params_desc?: string;
}