'use strict';

console.log('jp-verb-conjugation plugin added');

!function () {
    let curFormApiName = '';
    let keepUpdateTransform = false;

    function updateTransform(form) {
        let hiragana = window.ro$e.app.curWord()[1]; // FIXME: always assume the second entry of jp lexicon is hiragana
        ajax(`jp-verb-conjugation/${form}?${encodeURI(hiragana)}`).then(resp => {
            document.getElementById('jp-verb-transform').innerHTML = JSON.parse(resp).data;
        });
    }

    document.addEventListener('ro$eReady', () => ajax('jp-verb-conjugation/all').then(allForms => {
            allForms = JSON.parse(allForms);
            window.ro$e.UI.addPanelCommands(allForms.map(form => {
                return {
                    prompt: form.prompt,
                    attr: {class: 'jp-verb-conj'},
                    handler(event) {
                        Array.from(document.getElementsByClassName('jp-verb-conj')).forEach(
                            el => el.classList.remove('bordered')
                        );
                        event.target.classList.add('bordered');
                        curFormApiName = form.api;
                        updateTransform(form.api);
                    }
                }
            }));

            let cmdPanel = document.getElementsByClassName('jp-verb-conj')[0].parentNode;
            let transform = document.createElement('li');
            transform.innerHTML = `<span id="jp-verb-transform"></span>`;
            cmdPanel.appendChild(transform);

            document.getElementById('jp-verb-transform').addEventListener('click', event => {
                transform.classList.toggle('bordered');
                keepUpdateTransform = !keepUpdateTransform;
            });

            document.getElementById('next').addEventListener('click', () => {
                if (keepUpdateTransform) {
                    updateTransform(curFormApiName);
                } else {
                    Array.from(document.getElementsByClassName('jp-verb-conj')).forEach(
                        el => el.classList.remove('bordered')
                    );

                    document.getElementById('jp-verb-transform').innerHTML = '';
                }
            });
        })
    );
}();