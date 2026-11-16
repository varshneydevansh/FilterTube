// Android StudyTopicLabelTest (Ports Android 17a81affe): topic labels are sentence case, but known
// acronyms stay upper case. Android's StudySearchExplainer shows its topics through the same label.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');

test('acronyms stay upper case', () => {
    assert.equal(Engine.topicLabel('dbms', 'en'), 'DBMS');
    assert.equal(Engine.topicLabel('gate cse', 'en'), 'GATE CSE');
    assert.equal(Engine.topicLabel('operating systems', 'en'), 'Operating systems');
    assert.equal(Engine.topicLabel('algorithms and dsa', 'en'), 'Algorithms and DSA');
});

test('punctuation round an acronym still counts, other words keep their case, blanks pass through', () => {
    assert.equal(Engine.topicLabel('(dbms)', 'en'), '(DBMS)');
    assert.equal(Engine.topicLabel('basics of sql, html & css', 'en'), 'Basics of SQL, HTML & CSS');
    assert.equal(Engine.topicLabel('neet  biology', 'en'), 'NEET biology');
    assert.equal(Engine.topicLabel('  ', 'en'), '  ');
    // Locale-aware casing: Turkish dotted i.
    assert.equal(Engine.topicLabel('istatistik', 'tr'), 'İstatistik');
});
