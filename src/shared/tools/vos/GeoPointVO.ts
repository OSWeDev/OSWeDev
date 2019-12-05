
export default class GeoPointVO {

    public static createNew(longitude: number, latitude: number): GeoPointVO {
        let geopoint: GeoPointVO = new GeoPointVO();

        geopoint.longitude = longitude;
        geopoint.latitude = latitude;

        return geopoint;
    }

    public longitude: number;
    public latitude: number;
}