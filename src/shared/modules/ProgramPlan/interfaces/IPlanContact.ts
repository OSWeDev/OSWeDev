import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanContact extends IDistantVOBase {

    firstname: string;
    lastname: string;
    mail: string;
    mobile: string;
    infos: string;
}