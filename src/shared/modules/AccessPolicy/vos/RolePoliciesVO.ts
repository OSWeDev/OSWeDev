import ConversionHandler from '../../../tools/ConversionHandler';
import IDistantVOBase from '../../IDistantVOBase';

export default class RolePoliciesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "rolepolicies";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: RolePoliciesVO): RolePoliciesVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e.accpol_id = ConversionHandler.forceNumber(e.accpol_id);
        e.role_id = ConversionHandler.forceNumber(e.role_id);

        e._type = RolePoliciesVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: RolePoliciesVO[]): RolePoliciesVO[] {
        for (let i in es) {
            es[i] = RolePoliciesVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = RolePoliciesVO.API_TYPE_ID;

    public accpol_id: number;
    public role_id: number;
    public granted: boolean = false;
}