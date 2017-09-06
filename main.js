/*
* @Author: gigaflower
* @Date:   2017-09-01 10:47:10
* @Last Modified by:   gigaflower
* @Last Modified time: 2017-09-01 10:56:38
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const csvParse = require(path.join('csv-parse', 'lib', 'sync'));
const mime = require('mime');

const plugins = require('./config.json').plugins
    .filter(plugin => plugin.active)
    .map(
        plugin => [plugin.name, require(`./plugins/${plugin.name}/index.js`)] // TODO: windows sep needed?
    );

const __devMode = process.argv.includes('--dev');

const LEX_ROOT = path.join(__dirname, 'lexicons');
const WEB_ROOT = path.join(__dirname, __devMode ? 'src' : 'lib');
const MAIN_PAGE = 'App.html';
const MAIN_SCRIPT = 'App.js';

// HTTP response util
function fileResponse(filename) {
    filename = path.join(WEB_ROOT, filename);
    return new Promise(resolve => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                resolve([404, {}, `file '${filename}' not found`]);
            } else {
                if (__devMode && filename.endsWith('.js')) {
                    // real-time babel compilation, only for dev mode
                    data = require('babel-core').transform(data, {"presets": ["latest"]}).code;
                }
                if (path.basename(filename) === MAIN_PAGE) {
                    // add plugin hook
                    let hooks = '\n';
                    plugins.forEach(([name, _]) => {
                        hooks += `<script src="${name}.js"></script>\n`
                    });
                    data = data.replace(`<script src="${MAIN_SCRIPT}"></script>`,
                        `<script src="${MAIN_SCRIPT}"></script>` + hooks);
                }
                resolve([200, {'Content-Type': mime.lookup(filename)}, data]);
            }
        });
    });
}

function JSONResponse(obj) {
    if (typeof obj !== 'object') obj = {data: obj};
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
router.register('/', req => fileResponse(MAIN_PAGE));

router.register('/lex/all', req => {
    let files = fs.readdirSync(LEX_ROOT);
    let lexNames = files
        .filter(f => f.endsWith('.txt'))
        .map(f => ({name: f.slice(0, -4)}));

    return JSONResponse(lexNames);
});

router.register(/^\/lex\/(.+)$/, (req, filename) => {
    if (filename === 'default') filename = 'jp-alphabet';

    console.log(`finding lexicon "${filename}.txt"`);
    return new Promise(resolve => {
        fs.readFile(`${LEX_ROOT}/${filename}.txt`, (err, data) => {
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

// plugin api
plugins.forEach(([name, plugin]) => {
    router.register(new RegExp(`^/${name}/(.+?)(\\?.+)?$`), (req, apiName) => {
        console.log(`api ${req.url} is called`);
        let api = plugin[apiName]; // FIXME: client can visit every property regardless of api safety
        if (typeof api === 'function') {
            let parse = url.parse(req.url, true);  // 'true' means to parse the query string to a object
            let result;
            try {
                if (parse.search) {
                    let args = Object.keys(parse.query)[0];  // TODO: only one-argument api is considered
                    result = api(args)
                } else {
                    result = api();
                }
            } catch (err) {
                return new Promise(resolve => resolve([500, {}, err.message]));  // TODO: make this a new type of response
            }
            return JSONResponse(result);
        } else {
            return new Promise(resolve => resolve([404, {}, `'${req.url}' invalid`]));  // TODO: make this a new type of response
        }
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
console.log(`Rote v${require('./package.json').version} is running!`);
