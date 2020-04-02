import GeoPointFeatureGeometryVO from './GeoPointFeatureGeometryVO';
import GeoPointFeaturePropertieVO from './GeoPointFeaturePropertieVO';

export default class GeoPointFeatureVO {

    public geometry: GeoPointFeatureGeometryVO;
    public properties: GeoPointFeaturePropertieVO;
    public type: string;
}