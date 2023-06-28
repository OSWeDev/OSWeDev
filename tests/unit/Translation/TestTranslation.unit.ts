import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";
import TranslationsServerController from '../../../src/server/modules/Translation/TranslationsServerController';

test('Translation: test add translation to all locales', () => {

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, null, "code_text", "translated")).toStrictEqual({});
    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", null, "translated")).toStrictEqual({});
    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text", null)).toStrictEqual({
        code_lang: {
            code_text: ""
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text", "translated")).toStrictEqual({
        code_lang: {
            code_text: "translated"
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang.", "code_text", "translated")).toStrictEqual({
        "code_lang.": {
            code_text: "translated"
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.", "translated")).toStrictEqual({
        code_lang: {
            code_text: "translated"
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", ".code_text.", "translated")).toStrictEqual({
        code_lang: {
            code_text: "translated"
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                nested: "translated"
            }
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                nested: "translated"
            }
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text.nested.further", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                nested: {
                    further: "translated"
                }
            }
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text..further", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                further: "translated"
            }
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "code_text......further", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                further: "translated"
            }
        }
    });

    expect(TranslationsServerController.getInstance().addCodeToLocales(null, "code_lang", "..code_text......further...", "translated")).toStrictEqual({
        code_lang: {
            code_text: {
                further: "translated"
            }
        }
    });

});