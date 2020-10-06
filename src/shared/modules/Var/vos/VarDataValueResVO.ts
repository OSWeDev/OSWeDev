import { Moment } from 'moment';
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataValueResVO {
    public static API_TYPE_ID: string = "vdvr";

    public id: number;

    public _type: string = VarDataValueResVO.API_TYPE_ID;
    public index: string;

    public value: number;
    public value_type: number;
    public value_ts: Moment;

    public constructor() { }

    public set_from_vardata(vardata: VarDataBaseVO): VarDataValueResVO {
        this.value = vardata.value;
        this.index = vardata.index;
        this.value_ts = vardata.value_ts;
        this.value_type = vardata.value_type;
        return this;
    }

    public set_value(value: number): VarDataValueResVO {
        this.value = value;
        return this;
    }

    public set_value_type(value_type: number): VarDataValueResVO {
        this.value_type = value_type;
        return this;
    }

    public set_value_ts(value_ts: Moment): VarDataValueResVO {
        this.value_ts = value_ts;
        return this;
    }

    public set_index(index: string): VarDataValueResVO {
        this.index = index;
        return this;
    }
}