import ConversionHandler from '../../../tools/ConversionHandler';
import TextHandler from '../../../tools/TextHandler';

export default class AccessPolicyGroupVO {
    public static API_TYPE_ID: string = "accpolgrp";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: AccessPolicyGroupVO): AccessPolicyGroupVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = AccessPolicyGroupVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: AccessPolicyGroupVO[]): AccessPolicyGroupVO[] {
        for (let i in es) {
            es[i] = AccessPolicyGroupVO.forceNumeric(es[i]);
        }
        return es;
    }

    /**
     * Renvoie le code permettant de retrouver les trads d'une accesspolicygroup
     * @param group_name Nom du groupe
     */
    public static getTranslatableName(group_name: string): string {
        return "access_policy." + TextHandler.getInstance().formatTextToID(group_name) + ".title";
    }

    /**
     * Renvoie le uniqID
     * @param group_name Nom du groupe
     */
    public static getUniqID(group_name: string): string {
        return "apg." + TextHandler.getInstance().formatTextToID(group_name);
    }

    public id: number;
    public _type: string = AccessPolicyGroupVO.API_TYPE_ID;

    public uniq_id: string;
    public translatable_name: string;

    constructor(group_name: string) {
        this.uniq_id = AccessPolicyGroupVO.getUniqID(group_name);
        this.translatable_name = AccessPolicyGroupVO.getTranslatableName(group_name);
    }
}