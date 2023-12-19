import AbstractVO from "../../VO/abstract/AbstractVO";

/**
 * This class (or abstract) is used to store data
 * to be sent to the client through socket
 *
 * @class SocketDataVO
 */
export default class SocketDataVO extends AbstractVO {
    public static API_TYPE_ID: string = "socket_data";

    public id: number;
    public _type: string = SocketDataVO.API_TYPE_ID;

    public user_id: number;
    public client_tab_id: string;
    public socket_ids: string[];

    public creation_date: number;
}