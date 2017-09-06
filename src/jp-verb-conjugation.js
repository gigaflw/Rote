'use strict';

console.log('jp-verb-conjugation plugin added');
!function () {
    let curForm = '';

    function updateTransform(form) {
        let hiragana = window.ro$e.app.curWord()[1]; // FIXME: always assume the second entry of jp lexicon is hiragana
        ajax(`jp-verb-conjugation/${form}?${encodeURI(hiragana)}`).then(resp => {
            document.getElementById('jp-verb-transform').innerHTML = JSON.parse(resp).data;
        });
    }

    window.addEventListener('load', () => ajax('jp-verb-conjugation/all').then(allForms => {
            allForms = JSON.parse(allForms);
            window.ro$e.UI.addPanelCommands(allForms.map(form => {
                return {
                    prompt: form.prompt,
                    attr: {class: 'jp-verb-conj'},
                    handler(event) {
                        curForm = form.api;
                        updateTransform(form.api);
                    }
                }
            }));

            let cmdPanel = document.getElementsByClassName('jp-verb-conj')[0].parentNode;
            let transform = document.createElement('li');
            transform.innerHTML = `<p id="jp-verb-transform"></p>`;
            cmdPanel.appendChild(transform);

                alert('there');
            document.getElementById('next').addEventListener('click', () => {
                alert('here');
                updateTransform(curForm)
            });
        })
    );
}();