import { expect } from 'chai';
import 'mocha';
import CRUDHandler from '../../../shared/tools/CRUDHandler';


describe('TestCRUDHandler', () => {

    it('test getCRUDLink', () => {

        expect(CRUDHandler.getCRUDLink(null)).to.equal(null);
        expect(CRUDHandler.getCRUDLink('a')).to.equal('/manage/a');
        expect(CRUDHandler.getCRUDLink('b_a')).to.equal('/manage/b_a');
    });

    it('test getCreateLink', () => {
        expect(CRUDHandler.getCreateLink(null, true)).to.equal(null);
        expect(CRUDHandler.getCreateLink(null, false)).to.equal(null);

        expect(CRUDHandler.getCreateLink('a', true)).to.equal("#create_a");
        expect(CRUDHandler.getCreateLink('a', false)).to.equal('/manage/a/create');

        expect(CRUDHandler.getCreateLink('b_a', true)).to.equal("#create_b_a");
        expect(CRUDHandler.getCreateLink('b_a', false)).to.equal('/manage/b_a/create');
    });

    it('test getDeleteLink', () => {
        expect(CRUDHandler.getDeleteLink(null, null)).to.equal(null);
        expect(CRUDHandler.getDeleteLink(null, 1)).to.equal(null);

        expect(CRUDHandler.getDeleteLink('a', null)).to.equal(null);
        expect(CRUDHandler.getDeleteLink('a', 1)).to.equal('/manage/a/delete/1');

        expect(CRUDHandler.getDeleteLink('b_a', null)).to.equal(null);
        expect(CRUDHandler.getDeleteLink('b_a', 2)).to.equal('/manage/b_a/delete/2');
    });

    it('test getUpdateLink', () => {
        expect(CRUDHandler.getUpdateLink(null, null)).to.equal(null);
        expect(CRUDHandler.getUpdateLink(null, 1)).to.equal(null);

        expect(CRUDHandler.getUpdateLink('a', null)).to.equal(null);
        expect(CRUDHandler.getUpdateLink('a', 1)).to.equal('/manage/a/update/1');

        expect(CRUDHandler.getUpdateLink('b_a', null)).to.equal(null);
        expect(CRUDHandler.getUpdateLink('b_a', 2)).to.equal('/manage/b_a/update/2');
    });
});