import IDistantVOBase from '../../IDistantVOBase';

/**
 * N'a pas vocation a être stocké en base a priori, c'est la classe qui regroupe les params instanciés
 *  pour une data spécifique attendue (par exemple un compteur sur un cas particulier pour un jour particulier,
 *  qui sera affiché et mis à jour en live sur l'outil)
 */
export default interface IVarDataParamVOBase extends IDistantVOBase {

    var_id: number;
}