{
    function ajax(url) {
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
    }

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
                this.nextWord = () => {
                    let nextInd = 0;
                    if (entries.length <= 1) {
                        alert('词库耗尽')
                    } else {
                        do {
                            nextInd = Math.floor(Math.random() * (entries.length))
                        } while (nextInd === wordInd);
                        wordInd = nextInd;
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

            function initPanelCommands(commands) {
                let list = document.createElement('ul');

                for (let cmd of commands) {
                    let el = document.createElement('li');
                    el.innerHTML = cmd.prompt;
                    if (cmd.classList) {
                        cmd.classList.forEach(cls => el.classList.add(cls))
                    }
                    el.addEventListener('click', cmd.handler);
                    list.appendChild(el);
                }
                panel.appendChild(list);
            }

            function initPanelLexicons(lexicons) {
                let list = document.createElement('ul');

                for (let lex of lexicons) {
                    let el = document.createElement('li');
                    el.innerHTML = lex.name;
                    el.classList.add('lex-name');
                    el.addEventListener('click', event => app.setLexicon(lex.name));
                    list.appendChild(el);
                }
                panel.appendChild(list);
            }


            let headerCnt = app.getCurDictHeaders().length;
            let headIndIncre = x => (x + 1) % headerCnt;
            let shownHeaderInd = 0;
            let hiddenHeaderInd = headIndIncre(shownHeaderInd);
            let [shownWordSlot, hiddenWordSlot] = document.getElementsByClassName('word-slot');

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

            function setWord(word) {
                shownWordSlot.innerHTML = word[shownHeaderInd];
                hiddenWordSlot.innerHTML = word[hiddenHeaderInd];
            }

            initPanelCommands([
                {
                    prompt: app.getCurDictHeaders()[shownHeaderInd],
                    handler: event => {
                        if (headerCnt === 0) {
                            alert('词库为空！')
                        } else if (headerCnt > 1) {
                            toggleShownHeader();
                            event.target.innerHTML = app.getCurDictHeaders()[shownHeaderInd];
                        }
                    }
                }, {
                    prompt: app.getCurDictHeaders()[hiddenHeaderInd],
                    handler: event => {
                        if (headerCnt === 0) {
                            alert('词库为空！')
                        } else if (headerCnt > 1) {
                            toggleHiddenHeader();
                            event.target.innerHTML = app.getCurDictHeaders()[hiddenHeaderInd];
                        }
                    }
                }, {
                    prompt: 'next',
                    handler: event => setWord(app.nextWord()),
                }
            ]);

            // make the first word slot visible
            // panel.querySelector('li').classList.add('active');
            setWord(app.nextWord());

            // get a list of all available lexicons
            app.getAllDicts().then(data => {
                data = JSON.parse(data);
                initPanelLexicons(data);
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
}