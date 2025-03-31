
export default class PostModulesInitHookHolder {

    public static post_modules_installation_hooks: Array<() => void> = [];
}