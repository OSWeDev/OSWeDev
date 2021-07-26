import ServerAPIController from '../../../server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { expect } from 'chai';
import 'mocha';
import TranslationsServerController from '../../../server/modules/Translation/TranslationsServerController';


describe('Translation', () => {

    it('test add translation to all locales', () => {

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, null, "code_text", "translated")).to.be.deep.equal({});
        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", null, "translated")).to.be.deep.equal({});
        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text", null)).to.be.deep.equal({
            code_lang: {
                code_text: ""
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang.", "code_text", "translated")).to.be.deep.equal({
            "code_lang.": {
                code_text: "translated"
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", ".code_text.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: "translated"
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: "translated"
                }
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: "translated"
                }
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    nested: {
                        further: "translated"
                    }
                }
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text..further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text......further", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

        expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "..code_text......further...", "translated")).to.be.deep.equal({
            code_lang: {
                code_text: {
                    further: "translated"
                }
            }
        });

    });

});