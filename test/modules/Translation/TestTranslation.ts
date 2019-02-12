import { expect } from 'chai';
import 'mocha';
import ModuleTranslationServer from '../../../src/server/modules/Translation/ModuleTranslationServer';


describe('Translation', () => {

    it('test add translation to all locales', () => {

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, null, "code_text", "translated")).to.be.deep.equal({});
        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", null, "translated")).to.be.deep.equal({});
        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text", null)).to.be.deep.equal({
            code_lang: {
                code_text: ""
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang.", "code_text", "translated")).to.be.deep.equal({
            "code_lang.": {
                code_text: "translated"
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", ".code_text.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: "translated"
                }
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: "translated"
                }
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: {
                        further: "translated"
                    }
                }
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text..further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "code_text......further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

        expect(ModuleTranslationServer.getInstance().addCodeToLocales(null, "code_lang", "..code_text......further...", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

    });

});