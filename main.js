/*@flow*/
const Static = require('node-static');
const Http = require('http');

const file = new Static.Server('./www');
Http.createServer((request, response) => {
    request.addListener('end', () => {
        file.serve(request, response);
    }).resume();
}).listen(8080);
console.log("Navigate to http://localhost:8080/");
