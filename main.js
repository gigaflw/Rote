/*
* @Author: gigaflower
* @Date:   2017-09-01 10:47:10
* @Last Modified by:   gigaflower
* @Last Modified time: 2017-09-01 10:56:38
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const console = require('console');
const csvParse = require(path.join('csv-parse', 'lib', 'sync'));
const mime = require('mime');

const __devMode = process.argv.includes('--dev');

const lexRoot = path.join(__dirname, 'lexicons');
const webRoot = path.join(__dirname, __devMode ? 'src' : 'lib');


// HTTP response util
function fileResponse(filename) {
    filename = path.join(webRoot, filename);
    return new Promise(resolve => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                resolve([404, {}, `file '${filename}' not found`]);
            } else {
                if (__devMode && filename.endsWith('.js')) {
                    // real-time babel compilation, only for dev mode
                    data = require('babel-core').transform(data, {"presets": ["latest"]}).code;
                }
                resolve([200, {'Content-Type': mime.lookup(filename)}, data]);
            }
        });
    });
}

function JSONResponse(obj) {
    return new Promise(resolve => resolve([
            200,
            {'Content-Type': mime.lookup('json') + ';charset=utf-8'},
            JSON.stringify(obj)
        ])
    );
}

// router util
const router = {
    urls: [],
    register(regex, handler) {
        if (typeof regex === 'string') {
            // if url is given a string, only identical url should be matched
            regex = new RegExp(`^${regex}$`);
        }
        this.urls.push([regex, handler]);
    }
};


// register routers
router.register('/', req => fileResponse('App.html'));

router.register('/lex/all', req => {
    let files = fs.readdirSync(lexRoot);
    let lexNames = files
        .filter(f => f.endsWith('.txt'))
        .map(f => ({name: f.slice(0, -4)}));

    return JSONResponse(lexNames);
});

router.register(/^\/lex\/(.+)$/, (req, filename) => {
    if (filename === 'default') filename = 'jp-alphabet';

    console.log(`finding lexicon "${filename}.txt"`);
    return new Promise(resolve => {
        fs.readFile(`${lexRoot}/${filename}.txt`, (err, data) => {
            if (err) {
                resolve([404, {}, `"${filename}.txt" can not be found`]);
                console.log(`"${filename}.txt" can not be found`);
            } else {
                let [header, ...entries] = csvParse(data, {delimiter: '|'});
                console.log(`"${filename}.txt" parsed`);
                resolve(JSONResponse({header, entries, name: filename}));
            }
        });
    });
});

// server binding
http.createServer((req, resp) => {
    console.log(`request url "${req.url}"`);
    for (let [regex, handler] of router.urls) {
        if (req.url.match(regex)) {
            let [_, ...args] = req.url.match(regex);
            handler(req, ...args).then(
                ([statusCode, header, data]) => {
                    resp.writeHead(statusCode, header);
                    resp.end(data);
                }
            );
            return;
        }
    }

    // unregistered url, try finding file from `webRoot`
    fileResponse(req.url.slice(1)).then(([statusCode, header, data]) => {
        resp.writeHead(statusCode, header);
        resp.end(data);
    });
}).listen(14259);


// open web browser
require('opener')("http://localhost:14259/");
