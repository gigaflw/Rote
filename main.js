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
const babel = require('babel-core');
const mime = require('mime');

const lexRoot = path.join(__dirname, 'lexicons');
const webRoot = path.join(__dirname, 'src');

http.createServer((req, resp) => {
    // TODO: UTF-8 filename
    // TODO: better server
    if (req.url === '/lex/all') {
        let files = fs.readdirSync(lexRoot);
        let lexNames = files
            .filter(f => f.endsWith('.csv'))
            .map(f => ({name: f.slice(0, -4)}));

        resp.writeHead(200, { 'Content-Type': mime.lookup('json')+';charset=utf-8' });
        resp.end(JSON.stringify(lexNames));

    } else if (req.url.match(/^\/lex\/.+$/)) {
        let filename = req.url.match(/^\/lex\/(.+)$/)[1];
        if (filename === 'default') filename = 'jp-alphabet';

        fs.readFile(`${lexRoot}/${filename}.csv`, (err, data) => {
            if (err) {
                resp.writeHead(404);
                resp.end(`"${filename}.csv" can not be found`);

            } else {
                let [header, ...entries] = csvParse(data);

                resp.writeHead(200, { 'Content-Type': mime.lookup('json')+';charset=utf-8' });
                resp.end(JSON.stringify({
                    header, entries, name: filename,
                }));
            }
        });
    } else {
        let filename = path.join(webRoot, (req.url === '/' ? 'App.html' : req.url.slice(1)));
        fs.readFile(filename, (err, data) => {
            if (err) {
                resp.writeHeader(404);
                resp.end("No file found");
            } else if (filename.endsWith('.js')) {
                resp.writeHead(200, { 'Content-Type': mime.lookup('js') });
                resp.end(babel.transform(data, {"presets": ["latest"]}).code);
            } else {
                resp.writeHead(200, { 'Content-Type': mime.lookup(filename) });
                resp.end(data);
            }
        });
    }
}).listen(14259);

require('opener')("http://localhost:14259");
