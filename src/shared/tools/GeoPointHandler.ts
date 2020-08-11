import GeoPointVO from '../modules/GeoPoint/vos/GeoPointVO';

export default class GeoPointHandler {

    public static HOST_API: string = 'api-adresse.data.gouv.fr';
    public static URL_API: string = '/search/?q=';
    public static MILE_TO_KM: number = 1.60934;

    public static getInstance(): GeoPointHandler {
        if (!GeoPointHandler.instance) {
            GeoPointHandler.instance = new GeoPointHandler();
        }
        return GeoPointHandler.instance;
    }

    private static instance: GeoPointHandler = null;

    private constructor() { }

    public format(geopoint: GeoPointVO): string {
        if (geopoint) {
            return '(' + geopoint.x + ',' + geopoint.y + ')';
        }

        return null;
    }

    public split(point: string): GeoPointVO {
        if (!point) {
            return null;
        }

        let regexpGeopoint = /(\()(.*),(.*)(\))/i;
        let res: string[] = point.match(regexpGeopoint);

        if (!res) {
            return null;
        }

        if (res[2] === null || res[2] == '') {
            return null;
        }

        if (res[3] === null || res[3] == '') {
            return null;
        }

        return GeoPointVO.createNew(
            parseFloat(res[2]),
            parseFloat(res[3])
        );
    }

    public geopoint(point: string): GeoPointVO {
        return this.split(point);
    }

    public longitude(point: string): number {
        let geopoint: GeoPointVO = this.geopoint(point);

        return geopoint ? geopoint.x : null;
    }

    public latitude(point: string): number {
        let geopoint: GeoPointVO = this.geopoint(point);

        return geopoint ? geopoint.y : null;
    }
}