/*
* @Author: gigaflower
* @Date:   2017-09-01 10:47:10
* @Last Modified by:   gigaflower
* @Last Modified time: 2017-09-01 10:56:38
*/

const http = require('http');
const fs = require('fs');
const console = require('console');
const csvParse = require('csv-parse/lib/sync');

const lexRoot = __dirname + '/lexicons';
const webRoot = __dirname + '/src';

http.createServer((req, resp) => {
    // TODO: os-adaptive path
    // TODO: UTF-8 filename
    // TODO: better server
    if (req.url === '/lex/all') {
        let files = fs.readdirSync(lexRoot);
        let lexNames = files
            .filter(f => f.endsWith('.csv'))
            .map(f => ({name: f.slice(0, -4)}));
        resp.end(JSON.stringify(lexNames));
    } else if (req.url.match(/^\/lex\/.+$/)) {
        let filename = req.url.match(/^\/lex\/(.+)$/)[1];
        if (filename === 'default') filename = 'jp-alphabet';

        fs.readFile(`${lexRoot}/${filename}.csv`, (err, data) => {
            if (err) {
                resp.writeHeader(404);
                resp.end(`"${filename}.csv" can not be found`);
            } else {
                let [header, ...entries] = csvParse(data);
                resp.end(JSON.stringify({
                    header, entries, name: filename,
                }));
            }
        });
    } else {
        let filename = webRoot + (req.url === '/' ? '/App.html' : req.url);
        fs.readFile(filename, (err, data) => {
            if (err) {
                resp.writeHeader(404);
                resp.end("No file found");
            } else {
                resp.end(data);
            }
        });
    }
}).listen(14259);

const opener = require('opener');
opener("http://localhost:14259");
