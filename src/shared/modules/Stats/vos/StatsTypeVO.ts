
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsTypeVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_type";

    /**
     * Quand on compte le nombre de fois où la stat est lancée - valeur 1 donc à chaque fois et aggrégateur SUM
     */
    public static TYPE_COMPTEUR: string = "COMPTEUR";
    /**
     * Quand on indique un nombre correspondant par exemple au nombre de vars calculées dans un batch. Valeur numérique variable et aggrégateurs SUM, MEAN, MIN, MAX probablement
     */
    public static TYPE_QUANTITE: string = "QUANTITE";
    /**
     * Quand on indique une durée, valeur numérique variable et aggrégateurs SUM, MEAN, MIN, MAX probablement
     */
    public static TYPE_DUREE: string = "DUREE";

    public id: number;
    public _type: string = StatsTypeVO.API_TYPE_ID;

    public name: string;
}