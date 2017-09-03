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
            let screen = document.getElementById('screen');
            let panel = document.getElementById('panel');
            screen.innerHTML = panel.innerHTML = '';

            function initScreen(barCnt) {
                let str = '';
                for (let i = 0; i < barCnt; ++i) {
                    str += `<p><span class="word-slot hidden"></span></p>`;  // hidden by default
                }
                screen.innerHTML = str;
            }

            function initPanelCommands(commands) {
                let list = document.createElement('ul');

                for (let cmd of commands) {
                    let el = document.createElement('li');
                    el.innerHTML = cmd.prompt;
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

            initScreen(app.getCurDictHeaders().length);
            initPanelCommands([
                ...app.getCurDictHeaders().map(header => ({
                    prompt: header,
                    handler: event => {
                        event.target.classList.toggle('active');
                        this.toggleWordVisibility(
                            Array.from(event.target.parentNode.childNodes).indexOf(event.target)
                        )
                    }
                })), {
                    prompt: 'next',
                    handler: event => this.setWord(app.nextWord()),
                }
            ]);

            this.wordSlots = document.getElementsByClassName('word-slot');

            // make the first word slot visible
            panel.querySelector('li').classList.add('active');
            this.toggleWordVisibility(0);
            this.setWord(app.nextWord());

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

        setWord(word) {
            for (let ind = 0; ind < this.wordSlots.length; ++ind) {
                this.wordSlots[ind].innerHTML = word[ind];
            }
        },

        toggleWordVisibility(ind) {
            if (ind >= this.wordSlots.length) {
                throw RangeError(`${ind} out of range of word slots`)
            } else {
                this.wordSlots[ind].classList.toggle('hidden');
            }
        },
    };

    app.init();
}