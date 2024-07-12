
export default class GeoPointVO {

    public static createNew(x: number, y: number): GeoPointVO {
        if (!x || !y) {
            return null;
        }
        const geopoint: GeoPointVO = new GeoPointVO();

        geopoint.x = x;
        geopoint.y = y;

        return geopoint;
    }

    public static clone(geopoint: GeoPointVO): GeoPointVO {
        if (geopoint && geopoint.x && geopoint.y) {
            return GeoPointVO.createNew(
                geopoint.x,
                geopoint.y
            );
        }

        return null;
    }

    public x: number;
    public y: number;
}