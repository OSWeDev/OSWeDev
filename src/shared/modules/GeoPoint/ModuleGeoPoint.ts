import GeoPointHandler from '../../tools/GeoPointHandler';
import Module from '../Module';
import ModuleRequest from '../Request/ModuleRequest';
import GeoPointFeatureVO from './vos/GeoPointFeatureVO';
import GeoPointResponseVO from './vos/GeoPointResponseVO';
import GeoPointVO from './vos/GeoPointVO';

export default class ModuleGeoPoint extends Module {

    public static MODULE_NAME: string = 'GeoPoint';

    public static METHOD_GET: string = "GET";
    public static METHOD_POST: string = "POST";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleGeoPoint {
        if (!ModuleGeoPoint.instance) {
            ModuleGeoPoint.instance = new ModuleGeoPoint();
        }
        return ModuleGeoPoint.instance;
    }

    private static instance: ModuleGeoPoint = null;

    private constructor() {

        super("geopoint", ModuleGeoPoint.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
    }

    public registerApis() {
    }

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
        return GeoPointHandler.getInstance().format(await this.get_geopoint_adresse(adresse));
    }

    public async geopoint_formate(rue: string, cp: string, ville: string): Promise<string> {
        return GeoPointHandler.getInstance().format(await this.get_geopoint(rue, cp, ville));
    }
}