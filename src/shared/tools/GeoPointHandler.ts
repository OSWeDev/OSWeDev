import GeoPointVO from '../modules/GeoPoint/vos/GeoPointVO';

export default class GeoPointHandler {

    /* istanbul ignore next: nothing to test here */
    public static HOST_API: string = 'api-adresse.data.gouv.fr';
    public static URL_API: string = '/search/?q=';
    public static MILE_TO_KM: number = 1.60934;

    // istanbul ignore next: nothing to test
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

        const regexpGeopoint = /(\()(.+),(.+)(\))/i;
        const res: string[] = point.match(regexpGeopoint);

        if (!res) {
            return null;
        }

        const x: number = parseFloat(res[2]);
        if (res[2] === null || res[2] == '' || isNaN(x)) {
            return null;
        }

        const y: number = parseFloat(res[3]);
        if (res[3] === null || res[3] == '' || isNaN(y)) {
            return null;
        }

        return GeoPointVO.createNew(
            x,
            y
        );
    }

    public geopoint(point: string): GeoPointVO {
        return this.split(point);
    }

    public longitude(point: string): number {
        const geopoint: GeoPointVO = this.geopoint(point);

        return geopoint ? geopoint.x : null;
    }

    public latitude(point: string): number {
        const geopoint: GeoPointVO = this.geopoint(point);

        return geopoint ? geopoint.y : null;
    }
}