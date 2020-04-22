import { expect } from 'chai';
import 'mocha';
import VendorBuilder from '../../../generator/vendor_builder/VendorBuilder';
import IVendorGeneratorOptions from '../../../generator/vendor_builder/IVendorGeneratorOptions';


describe('VendorBuilder', () => {

    it('test get_vendor_file_content', () => {
        expect(VendorBuilder.getInstance().get_vendor_file_content(null)).to.equal('');

        let vendor_generator_options: IVendorGeneratorOptions = {
            addins: null
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal('');

        vendor_generator_options = {
            addins: []
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal('');

        vendor_generator_options = {
            addins: ['a']
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal("require('a');\n");

        vendor_generator_options = {
            addins: ['oswedev']
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal('');

        vendor_generator_options = {
            addins: ['a', 'oswedev']
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal("require('a');\n");
        vendor_generator_options = {
            addins: ['a', 'b']
        };
        expect(VendorBuilder.getInstance().get_vendor_file_content(vendor_generator_options)).to.equal("require('a');\nrequire('b');\n");
    });
});