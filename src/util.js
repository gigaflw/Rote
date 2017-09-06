'use strict';
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