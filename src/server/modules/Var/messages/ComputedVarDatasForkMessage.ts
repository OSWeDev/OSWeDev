import IForkMessage from '../../Fork/interfaces/IForkMessage';
import IVarDataVOBase from '../../../../shared/modules/Var/interfaces/IVarDataVOBase';

export default class ComputedVarDatasForkMessage implements IForkMessage {

    public static FORK_MESSAGE_TYPE: string = "ComputedVarDatas";

    public message_type: string = ComputedVarDatasForkMessage.FORK_MESSAGE_TYPE;

    public constructor(public message_content: IVarDataVOBase[]) { }
}