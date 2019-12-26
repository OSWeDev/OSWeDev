
export default class GeoPointVO {

    public static createNew(x: number, y: number): GeoPointVO {
        let geopoint: GeoPointVO = new GeoPointVO();

        geopoint.x = x;
        geopoint.y = y;

        return geopoint;
    }

    public x: number;
    public y: number;
}