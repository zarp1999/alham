const test = require('node:test');
const assert = require('node:assert/strict');
const {getLanguage, tr} = require('../.test-build/i18n');
test('first launch defaults to English', () => { assert.equal(getLanguage(), 'en'); assert.equal(tr('今日'), 'Today'); });
