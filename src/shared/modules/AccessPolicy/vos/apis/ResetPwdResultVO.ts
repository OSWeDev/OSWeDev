import IDistantVOBase from '../../../IDistantVOBase';

export default class ResetPwdResultVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "reset_pwd_result";

    // Codes d'erreur possibles
    public static readonly ERROR_CODE_PASSWORD_REUSED = "PASSWORD_REUSED";
    public static readonly ERROR_CODE_PASSWORD_INVALID = "PASSWORD_INVALID";
    public static readonly ERROR_CODE_INVALID_CHALLENGE = "INVALID_CHALLENGE";
    public static readonly ERROR_CODE_USER_BLOCKED = "USER_BLOCKED";
    public static readonly ERROR_CODE_CHALLENGE_EXPIRED = "CHALLENGE_EXPIRED";
    public static readonly ERROR_CODE_UNKNOWN = "UNKNOWN";

    public id: number;
    public _type: string = ResetPwdResultVO.API_TYPE_ID;

    public success: boolean = false;
    public error_code: string = null;

    public constructor(success: boolean = false, error_code: string = null) {
        this.success = success;
        this.error_code = error_code;
    }

    public static createSuccess(): ResetPwdResultVO {
        return new ResetPwdResultVO(true, null);
    }

    public static createError(error_code: string): ResetPwdResultVO {
        return new ResetPwdResultVO(false, error_code);
    }
}

export const ResetPwdResultVOStatic = ResetPwdResultVO;
