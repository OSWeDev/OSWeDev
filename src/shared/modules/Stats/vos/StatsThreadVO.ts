
import INamedVO from '../../../interfaces/INamedVO';

export default class StatsThreadVO implements INamedVO {
    public static API_TYPE_ID: string = "stats_thread";

    public id: number;
    public _type: string = StatsThreadVO.API_TYPE_ID;

    /**
     * Le nom qu'on va utiliser en label
     */
    public name: string;

    /**
     * Les alias qu'on pourra accepter de la part des stats
     */
    public aliases: string[];
}