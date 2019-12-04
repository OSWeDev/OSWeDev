import ModuleRequest from '../../server/modules/Request/ModuleRequest';
import GeoPointFeatureVO from './vos/GeoPointFeatureVO';
import GeoPointResponseVO from './vos/GeoPointResponseVO';
import GeoPointVO from './vos/GeoPointVO';

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

    public async get_geopoint(rue: string, cp: string, ville: string): Promise<GeoPointVO> {
        if (rue || cp || ville) {
            let adresse: string[] = [
                (rue ? rue : ''),
                (cp ? cp : ''),
                (ville ? ville : '')
            ];

            return this.get_geopoint_adresse(adresse.join(' '));
        }

        return null;
    }

    public async get_geopoint_adresse(adresse: string): Promise<GeoPointVO> {
        if (!adresse) {
            return null;
        }

        let path: string = encodeURI(GeoPointHandler.URL_API + adresse);

        let res: GeoPointResponseVO = await ModuleRequest.getInstance().sendRequestFromApp(
            ModuleRequest.METHOD_GET,
            GeoPointHandler.HOST_API,
            path,
            {},
            {},
            true
        );

        if (res && res.features && res.features.length > 0) {
            let geopoint_feature: GeoPointFeatureVO = res.features[0];

            if (!geopoint_feature || !geopoint_feature.geometry || !geopoint_feature.geometry.coordinates || geopoint_feature.geometry.coordinates.length != 2) {
                return null;
            }

            return GeoPointVO.createNew(
                geopoint_feature.geometry.coordinates[0],
                geopoint_feature.geometry.coordinates[1]
            );
        }

        return null;
    }
    public async geopoint_formate_adresse(adresse: string): Promise<string> {
        return this.format(await this.get_geopoint_adresse(adresse));
    }

    public async geopoint_formate(rue: string, cp: string, ville: string): Promise<string> {
        return this.format(await this.get_geopoint(rue, cp, ville));
    }

    public format(geopoint: GeoPointVO): string {
        if (geopoint) {
            return '(' + geopoint.longitude + ',' + geopoint.latitude + ')';
        }

        return null;
    }

    public split(point: string): GeoPointVO {
        if (!point) {
            return null;
        }

        let regexpGeopoint = /(\()(.*),(.*)(\))/i;
        let res: string[] = point.match(regexpGeopoint);

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

        return geopoint ? geopoint.longitude : null;
    }

    public latitude(point: string): number {
        let geopoint: GeoPointVO = this.geopoint(point);

        return geopoint ? geopoint.latitude : null;
    }
}