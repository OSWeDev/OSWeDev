import ModuleFileServer from '../../server/modules/File/ModuleFileServer';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import IVendorGeneratorOptions from './IVendorGeneratorOptions';

export default class VendorBuilder {

    public static getInstance(): VendorBuilder {
        if (!VendorBuilder.instance) {
            VendorBuilder.instance = new VendorBuilder();
        }
        return VendorBuilder.instance;
    }

    protected static instance: VendorBuilder = null;

    private constructor() { }

    public async generate_vendor() {

        let package_json = process.cwd() + '/package.json';
        let vendor_package_json = process.cwd() + '/vendor/package.json';

        let vendor_path = './vendor/vendor.js';
        let vendor_generator_options: IVendorGeneratorOptions = require(process.cwd() + '/vendor/vendor_generator_options.json');

        let vendor_content = '';

        let deps: any = Object.assign({}, require(package_json).dependencies);
        let vendor_deps: any = Object.assign({}, require(vendor_package_json).dependencies);

        let has_incoherence: boolean = false;
        for (let dep_name in vendor_deps) {

            if (dep_name.toLowerCase() == 'oswedev') {
                continue;
            }

            // on check de possibles incohérences entre les 2 fichiers au passage
            if ((!deps[dep_name]) || (deps[dep_name] != vendor_deps[dep_name])) {
                ConsoleHandler.getInstance().error("Incohérence entre le package.json principal et le vendor/package.json :" + dep_name + ": package.json:" + deps[dep_name] + ": vendor/package.json:" + vendor_deps[dep_name] + ":");
                has_incoherence = true;
            }

            let is_banned: boolean = false;
            for (let i in vendor_generator_options.bans) {

                let ban = vendor_generator_options.bans[i];

                if (ban.toLowerCase() == dep_name.toLowerCase()) {
                    is_banned = true;
                    break;
                }
            }

            if (is_banned) {
                continue;
            }

            vendor_content += "require('" + dep_name + "');\n";
        }

        for (let i in vendor_generator_options.addins) {
            let addin = vendor_generator_options.addins[i];

            vendor_content += "require('" + addin + "');\n";
        }

        if (has_incoherence) {
            throw new Error('Package.json incohérents ! On stop le générateur');
        }

        await ModuleFileServer.getInstance().writeFile(vendor_path, vendor_content);
    }
}