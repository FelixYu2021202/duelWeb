const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const config = JSON.parse(fs.readFileSync("./data/ports.json", "utf8"));

const host = config.ip;
const port = config.serverPort;

/**
 * 
 * @param {string} fn 
 * @param {http.ServerResponse<http.IncomingMessage> & {req: http.IncomingMessage}} res 
 * @param {string} fld 
 * @param {string} ctt 
 */
function load_file(fn, res, fld, ctt) {
    fs.readFile("./" + fld + fn, (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end(`Error: ${err.code}`);
        }
        res.writeHead(200, {
            "Content-Type": ctt
        });
        res.end(data, "utf-8");
    });
}

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse<http.IncomingMessage> & {req: http.IncomingMessage}} res 
 */
function load(req, res) {
    fs.appendFile("./logs/server.log", `[${Date.now()}] ${req.url}\n`, () => {
        let url = req.url.replace(/client=\w+/, "client=***");
        console.log(`[${Date.now()}] ${url}`);
    });
    const parsed = url.parse(req.url, true);
    const filePath = parsed.pathname == "/" ? "/index.html" : parsed.pathname;
    const extname = path.extname(filePath).toLowerCase();
    const ctt = {
        ".css": "text/css",
        ".html": "text/html",
        ".ico": "image/x-icon",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".js": "application/javascript",
        ".json": "text/plain",
        ".png": "image/png",
    };
    const fld = {
        ".css": ".",
        ".html": ".",
        ".ico": ".",
        ".jpeg": ".",
        ".jpg": ".",
        ".js": ".",
        ".json": ".",
        ".png": ".",
    }
    load_file(filePath, res, fld[extname], ctt[extname]);
}

const server = http.createServer(load);

server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
