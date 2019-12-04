import GeoPointFeatureVO from './GeoPointFeatureVO';

export default class GeoPointResponseVO {
    public attribution: string;
    public features: GeoPointFeatureVO[];
    public licence: string;
    public limit: number;
    public query: string;
    public type: string;
    public version: string;
}