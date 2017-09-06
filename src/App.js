'use strict';

window.ro$e = {};

/*

window.ro$e is the global object of this app
-------------
available API:

// basic
window.ro$e.app.setLexicon(<lexiconName>) -> A Promise
window.ro$e.app.getAllLexicons() -> A Promise with [lexicon_name_1, lexicon_name_2, ...]
window.ro$e.app.getCurLexiconName() -> name of the current lexicon
window.ro$e.app.getCurLexiconHeaders() -> [<header1>, <header2>, ...]
window.ro$e.app.curWord() -> [<word_entry1>, <word_entry2>, ...]
window.ro$e.app.nextWord()  // set the next word according to the traversing method

// traversing
window.ro$e.app.getAllTraverseMethods() -> [<method_name1>, <method_name2>, ...]
window.ro$e.app.getTraverseMethod() -> <current_method>
window.ro$e.app.setTraverseMethod(<method_name>)

// UI
window.ro$e.UI.addPanelCommands(commands)
 create a new row of panel commands, where commands is a list of:
 {
    prompt: <text_on_button>,
    handler: <handler_of_click_event>,
    classList: <class_list_of_button>, (optional)
 }
--------------
 */

window.ro$e.app = {
    init(lexicon = undefined) {
        if (lexicon === undefined) {
            this.setLexicon('default');
        } else {
            let {name, header, entries} = lexicon;

            this.getCurLexiconName = () => name;
            this.getCurLexiconHeaders = () => header;

            let wordInd = 0;

            this.curWord = () => entries[wordInd];

            let traverseMethod = 'random';  // available methods: 'default', 'random', 'shuffle'
            let shuffleTable = entries.map((val, ind) => ind);
            let shuffledInd = 0;
            this.getAllTraverseMethods = () => ['random', 'shuffle', 'default'];
            this.getTraverseMethod = () => traverseMethod;
            this.setTraverseMethod = method => {
                traverseMethod = method;
                if (method === 'shuffle') shuffleTable.shuffle();
                console.log(`traverse method set to '${method}'`);
            };

            this.nextWord = () => {
                if (entries.length <= 1) {
                    alert('词库耗尽')
                } else {
                    if (traverseMethod === 'default') {
                        wordInd = (wordInd + 1) % entries.length;
                    } else if (traverseMethod === 'random') {
                        let nextInd;
                        do {
                            nextInd = Math.floor(Math.random() * (entries.length))
                        } while (nextInd === wordInd);
                        wordInd = nextInd;
                    } else if (traverseMethod === 'shuffle') {
                        shuffledInd = (shuffledInd + 1) % entries.length;
                        if (shuffledInd === 0) shuffleTable.shuffle();
                        wordInd = shuffleTable[shuffledInd];
                    }
                }
                return this.curWord();
            };
        }
    },

    getAllLexicons() {
        return ajax('/lex/all')
    },
    setLexicon(name) {
        if (this.getCurLexiconName && name === this.getCurLexiconName()) {
            console.log(`Already in lexicon '${name}'`);
        }
        return ajax('/lex/' + name).then(data => {
            data = JSON.parse(data);
            this.init(data);
            window.ro$e.UI.init();
        })
    },
};

window.ro$e.UI = {
    addPanelCommands(commands) {
        let list = document.createElement('ul');

        for (let cmd of commands) {
            let el = document.createElement('li');
            el.innerHTML = cmd.prompt;
            if (cmd.classList) {
                cmd.classList.forEach(cls => el.classList.add(cls));
            }
            el.addEventListener('click', cmd.handler);
            list.appendChild(el);
        }
        document.getElementById('panel').appendChild(list);
    },

    init() {
        // this function should only be called once
        // otherwise, panel created by plugins will be cleared
        if (!this.inited) {
            this.inited = true;
        } else {
            return;
        }

        let app = window.ro$e.app;

        let headerCnt = app.getCurLexiconHeaders().length;
        let headIndIncre = x => (x + 1) % headerCnt;
        let shownHeaderInd = 0;
        let hiddenHeaderInd = headIndIncre(shownHeaderInd);
        let shownWordSlot = document.getElementsByClassName('word-slot')[0];
        let hiddenWordSlot = document.getElementsByClassName('word-slot')[1];

        function toggleShownHeader() {
            shownHeaderInd = headIndIncre(shownHeaderInd);
            if (shownHeaderInd === hiddenHeaderInd) shownHeaderInd = headIndIncre(shownHeaderInd);
            setWord(app.curWord());
        }

        function toggleHiddenHeader() {
            hiddenHeaderInd = headIndIncre(hiddenHeaderInd);
            if (shownHeaderInd === hiddenHeaderInd) hiddenHeaderInd = headIndIncre(hiddenHeaderInd);
            setWord(app.curWord());
        }

        function resetPanelCommandHeaders() {
            // called after lexicon has changed to update header in command panel
            let list = document.getElementById('panel').firstChild;
            list.childNodes[0].innerHTML = app.getCurLexiconHeaders()[shownHeaderInd];
            list.childNodes[1].innerHTML = app.getCurLexiconHeaders()[hiddenHeaderInd];
        }

        this.addPanelCommands([
            {   // command for visible word slot setting
                prompt: app.getCurLexiconHeaders()[shownHeaderInd],
                handler: event => {
                    if (headerCnt === 0) {
                        alert('词库为空！')
                    } else if (headerCnt > 1) {
                        toggleShownHeader();
                        event.target.innerHTML = app.getCurLexiconHeaders()[shownHeaderInd];
                    }
                }
            }, { // command for hidden word slot setting
                prompt: app.getCurLexiconHeaders()[hiddenHeaderInd],
                handler: event => {
                    if (headerCnt === 0) {
                        alert('词库为空！')
                    } else if (headerCnt > 1) {
                        toggleHiddenHeader();
                        event.target.innerHTML = app.getCurLexiconHeaders()[hiddenHeaderInd];
                    }
                }
            }, {  // command for next word
                prompt: 'next',
                handler: event => setWord(app.nextWord()),
            }, {  // command for traverse order
                prompt: app.getTraverseMethod(),
                handler: event => {
                    let allMethods = app.getAllTraverseMethods();
                    let newMethod =
                        allMethods[(allMethods.indexOf(app.getTraverseMethod()) + 1) % allMethods.length];
                    event.target.innerHTML = newMethod;
                    app.setTraverseMethod(newMethod);
                },
            }
        ]);

        function setWord(word) {
            shownWordSlot.innerHTML = word[shownHeaderInd];
            hiddenWordSlot.innerHTML = word[hiddenHeaderInd];
        }

        setWord(app.nextWord());

        // UI for lexicons
        function setLexiconNameClass() {
            let curLex = app.getCurLexiconName();
            for (let el of document.getElementsByClassName('lex-name')) {
                if (el.innerHTML === curLex) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        }
        app.getAllLexicons().then(data => {
            // get a list of all available lexicons
            let lexicons = JSON.parse(data);

            this.addPanelCommands(lexicons.map(lex => ({
                prompt: lex.name,
                classList: ['lex-name'],
                handler: event => app.setLexicon(lex.name).then(() => {
                    setWord(app.nextWord());
                    setLexiconNameClass();
                    resetPanelCommandHeaders();
                }),
            })));

            setLexiconNameClass();
        });
    }
};

window.ro$e.app.init();
console.log('Rote is running!');
