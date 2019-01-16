import IDistantVOBase from '../modules/IDistantVOBase';

export default interface IParameterizedVO extends IDistantVOBase {

    json_params: string;
}