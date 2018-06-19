import ConversionHandler from '../../../tools/ConversionHandler';

export default class RoleVO {
    public static API_TYPE_ID: string = "role";

    // Pour forcer les numériques à court terme
    public static forceNumeric(e: RoleVO): RoleVO {
        if (!e) {
            return null;
        }

        e.id = ConversionHandler.forceNumber(e.id);

        e._type = RoleVO.API_TYPE_ID;

        return e;
    }

    public static forceNumerics(es: RoleVO[]): RoleVO[] {
        for (let i in es) {
            es[i] = RoleVO.forceNumeric(es[i]);
        }
        return es;
    }

    public id: number;
    public _type: string = RoleVO.API_TYPE_ID;

    public translatable_name: string;
}