import IDistantVOBase from '../../IDistantVOBase.1';
import VarDataParamVOBase from './VarDataParamVOBase';

/**
 * N'a pas vocation a être stocké en base a priori, c'est la classe qui va gérer la data calculée dynamiquement
 */
export default abstract class VarDataVOBase extends VarDataParamVOBase implements IDistantVOBase {

    public static TYPE_SOURCE_LABELS: string[] = [
        'infos_jour.types_sources.default',
        'infos_jour.types_sources.import',
        'infos_jour.types_sources.nodata'];
    public static TYPE_SOURCE_DEFAULT: number = 0;
    public static TYPE_SOURCE_IMPORT: number = 1;
    public static TYPE_SOURCE_NODATA: number = 2;

    public id: number;
    public abstract _type: string;


    /**
     * La data importée hérite directement du dataParam correspondant, qui contient les infos nécessaires pour définir
     *  la provenance de cette valeur importée
     * public var_group_id: number;
     * public json_params: string;
     */

    public typesInfo: number[];
}