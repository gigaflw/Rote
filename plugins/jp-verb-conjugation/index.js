/*
* @Author: gigaflower
* @Date:   2017-09-01 10:47:10
* @Last Modified by:   gigaflower
* @Last Modified time: 2017-09-05 10:56:38
*/

const fs = require('fs');
const path = require('path');
const csvParse = require(path.join('csv-parse', 'lib', 'sync'));

let hiraganaRange = [0x3014, 0x3096];
let chars =
    `あいうえお
かきくけこ
たちつてと
さしすせそ
なにぬねの
はひふへほ
まみむめも
らりるれろ
やいゆえよ
わいうえを
がぎぐげご
だぢづでど
ざじずぜぞ
ばびぶべぼ
ぱぴぷぺぽ`.replace(/\n/g, '');

let charsTable = Array.from({length: chars.length / 5}).map((_, ind) => chars.slice(ind * 5, (ind + 1) * 5));

let getColumn = ch => {
    let ind = chars.indexOf(ch) % 5;
    return charsTable.map(line => line[ind]);
};

let typeTwoVerbReg = new RegExp(`[${getColumn('い') + getColumn('え')}]る$`);

let util = {
    lexicon: null,
    initLexicon(filename) {
        util.lexicon = {};
        csvParse(fs.readFileSync(filename), {delimiter: '|'}).forEach(([v, k]) => util.lexicon[k] = v);
    },
    all() {
        return [
            {prompt: 'ます型', api: 'masuForm'},
            {prompt: 'ない型', api: 'naiForm'},
        ]
    },
    isHiragana(word) {
        return Array.from(word).every(ch => ch.charCodeAt(0) >= hiraganaRange[0] && ch.charCodeAt(0) <= hiraganaRange[1]);
    },
    kataganaToHiragana(verb) {
        if (util.lexicon === null) {
            throw Error('no lexicon fed to jp util!');
        } else if (util.lexicon[verb] === undefined) {
            throw Error(`unknown verb '${verb}'!`);
        } else {
            return util.lexicon[verb];
        }
    },
    verbType(verb) { //
        // assert(isDictionaryForm(verb) && isHiragana(verb))
        let hira = util.isHiragana(verb) ? verb : util.kataganaToHiragana(verb);
        if (hira.endsWith('する') || hira === 'くる') {
            return 3;
        } else if (hira.match(typeTwoVerbReg) && !['はしる', 'きる', 'はいる', 'かえる'].includes(hira)) {
            return 2;
        } else {
            return 1;
        }
    },
    masuForm(verb) { // verb needs to be in dictionary form
        if (verb === 'くる' || verb === '来る') {
            return '来ます';
        } else {
            let type = util.verbType(verb);
            if (type === 1) {
                let ind = chars.indexOf(verb[verb.length - 1]);
                if (ind % 5 !== 2) throw Error(`不能处理非 う 段的 1 类动词 "${verb}"`);
                return verb.slice(0, -1) + chars[ind - 1] + 'ます';  // う段 -> い段
            } else if (type === 2) {
                return verb.slice(0, -1) + 'ます';  // る　->　ます
            } else {
                return verb.slice(0, -2) + 'します';  // する　->　します
            }

        }
    },
    naiForm(verb) { // verb needs to be in dictionary form
        console.log(verb);
        if (verb === 'くる' || verb === '来る') {
            return '来ない';
        } else {
            let type = util.verbType(verb);
            if (type === 1) {
                let ind = chars.indexOf(verb[verb.length - 1]);
                if (ind % 5 !== 2) throw Error(`不能处理非 う 段的 1 类动词 "${verb}"`);
                return verb.slice(0, -1) + chars[ind - 2] + 'ない';  // う段 -> あ段
            } else if (type === 2) {
                return verb.slice(0, -1) + 'ない';  // る　->　ない
            } else {
                return verb.slice(0, -2) + 'しない';  // する　->　しない
            }

        }
    }
};

util.initLexicon(path.join(__dirname, 'jp-verb.txt'));

module.exports = util;