import IDistantVOBase from '../../IDistantVOBase';

export default interface IInstantiatedPageComponent extends IDistantVOBase {
    page_component_id: number;
    page_id: number;
    weight: number;
}