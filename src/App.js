'use strict';
{
    Array.prototype.shuffle = function () {
        for (let i = 0; i < this.length; ++i) {
            let j = Math.floor(Math.random() * this.length);
            if (i !== j) [this[i], this[j]] = [this[j], this[i]];
        }
    };

    let ajax = url => {
        return new Promise((resolve, reject) => {
            let client = new XMLHttpRequest();
            client.open('GET', url);
            client.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        resolve(this.response);
                    } else {
                        reject(new Error(this.responseText));
                    }
                }
            };
            client.send();
        });
    };

    let app = {
        init(lexicon = undefined) {
            if (lexicon === undefined) {
                this.setLexicon('default');
            } else {
                let {name, header, entries} = lexicon;

                this.getCurDictName = () => name;
                this.getCurDictHeaders = () => header;

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

        getAllDicts() {
            return ajax('/lex/all')
        },
        setLexicon(name) {
            if (this.getCurDictName && name === this.getCurDictName()) {
                console.log(`Already in lexicon '${name}'`);
            }
            return ajax('/lex/' + name).then(data => {
                data = JSON.parse(data);
                this.init(data);
                UI.init();
            })
        },
    };

    let UI = {
        init() {
            let panel = document.getElementById('panel');
            panel.innerHTML = '';


            let headerCnt = app.getCurDictHeaders().length;
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

            function addPanelCommands(commands) {
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
                panel.appendChild(list);
            }

            addPanelCommands([
                {   // command for visible word slot setting
                    prompt: app.getCurDictHeaders()[shownHeaderInd],
                    handler: event => {
                        if (headerCnt === 0) {
                            alert('词库为空！')
                        } else if (headerCnt > 1) {
                            toggleShownHeader();
                            event.target.innerHTML = app.getCurDictHeaders()[shownHeaderInd];
                        }
                    }
                }, { // command for hidden word slot setting
                    prompt: app.getCurDictHeaders()[hiddenHeaderInd],
                    handler: event => {
                        if (headerCnt === 0) {
                            alert('词库为空！')
                        } else if (headerCnt > 1) {
                            toggleHiddenHeader();
                            event.target.innerHTML = app.getCurDictHeaders()[hiddenHeaderInd];
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
            app.getAllDicts().then(data => {
                // get a list of all available lexicons
                let lexicons = JSON.parse(data);

                // initPanelLexicons(data);
                addPanelCommands(lexicons.map(lex => ({
                    prompt: lex.name,
                    classList: ['lex-name'],
                    handler: event => app.setLexicon(lex.name),
                })));

                let curDict = app.getCurDictName();
                for (let el of document.getElementsByClassName('lex-name')) {
                    if (el.innerHTML === curDict) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                }
            });
        },
    };

    app.init();
    console.log('Rote is running!');
}