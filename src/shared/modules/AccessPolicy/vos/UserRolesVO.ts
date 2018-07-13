import ConversionHandler from '../../../tools/ConversionHandler';
import IDistantVOBase from '../../IDistantVOBase';

export default class UserRolesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "userroles";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: UserRolesVO): UserRolesVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.getInstance().forceNumber(e.id);

        e.user_id = ConversionHandler.getInstance().forceNumber(e.user_id);
        e.role_id = ConversionHandler.getInstance().forceNumber(e.role_id);

        e._type = UserRolesVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: UserRolesVO[]): UserRolesVO[] {
        for (let i in es) {
            es[i] = UserRolesVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = UserRolesVO.API_TYPE_ID;

    public user_id: number;
    public role_id: number;
}