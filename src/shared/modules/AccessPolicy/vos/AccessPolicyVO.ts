import ConversionHandler from '../../../tools/ConversionHandler';
import IDistantVOBase from '../../IDistantVOBase';
import TextHandler from '../../../tools/TextHandler';

export default class AccessPolicyVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "accpol";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: AccessPolicyVO): AccessPolicyVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e.group_id = ConversionHandler.getInstance().forceNumber(e.group_id);

        e._type = AccessPolicyVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: AccessPolicyVO[]): AccessPolicyVO[] {
        for (let i in es) {
            es[i] = AccessPolicyVO.forceNumeric(es[i]);
        }
        return es;
    }

    /**
     * Renvoie le code permettant de retrouver les trads d'une accesspolicy
     * @param group_name Nom du groupe
     * @param policy_name Nom de la policy
     */
    public static getTranslatableName(group_name: string, policy_name: string): string {
        return "access_policy." + TextHandler.getInstance().formatTextToID(group_name) + "." + TextHandler.getInstance().formatTextToID(policy_name) + ".title";
    }

    /**
     * Renvoie le uniqID
     * @param group_name Nom du groupe
     * @param policy_name Nom de la policy
     */
    public static getUniqID(group_name: string, policy_name: string): string {
        return "ap." + TextHandler.getInstance().formatTextToID(group_name) + "." + TextHandler.getInstance().formatTextToID(policy_name);
    }

    public id: number;
    public _type: string = AccessPolicyVO.API_TYPE_ID;

    public uniq_id: string;
    public translatable_name: string;
    public group_id: number;

    constructor(group_name: string, policy_name: string, group_id: number) {
        this.uniq_id = AccessPolicyVO.getUniqID(group_name, policy_name);
        this.translatable_name = AccessPolicyVO.getTranslatableName(group_name, policy_name);
        this.group_id = group_id;
    }
}