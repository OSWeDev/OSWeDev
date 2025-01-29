import IForkMessage from '../../Fork/interfaces/IForkMessage';

export default class SetEnvParamThreadMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "SET_ENV_PARAM";

    public message_type: string = SetEnvParamThreadMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: { env_param_name: string, env_param_value: boolean | string | number }) { }
}