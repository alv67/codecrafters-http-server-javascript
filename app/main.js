const net = require('net');
const fs = require('fs');
const path = require('path');

var directory = '';

// check if --directory flag is passed
const directoryIndex = process.argv.indexOf('--directory');
if (directoryIndex == -1 || !process.argv[directoryIndex + 1]) {
    directory = '.'
} else {
    directory =  process.argv[directoryIndex + 1];
}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
console.log(`  directory: ${directory}`);


// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (buffer) => {
    var request = buffer.toString().split('\r\n');
    const [method, urlpath] = request[0].split(' ');
    // --- debug ---
    console.log(`Path: '${urlpath}'`);

    var headers = {};
    var response = '';

    switch (method) {

        case "GET":
            // parse headers
            for (var line of request.slice(1)) {
                // empty line marks end of headers
                if (line.trim() === '') break;
        
                // split line into key-value pair
                var [key, ...value] = line.trim().split(':');
                headers[key.trim()] = value.join(':').trim() // join(':') to recontruct values wich have : inside
            }
            // --- debug ---
            console.log(`headers:\n${JSON.stringify(headers)}`);
            
            if (urlpath === '/') {
              response  = 'HTTP/1.1 200 OK\r\n\r\n';
            } else if (urlpath.trim().startsWith('/echo/')) {
                var body = urlpath.trim().substring('/echo/'.length);
                console.log(`echo: ${body}`);
                response = `HTTP/1.1 200 OK\r\n`;
                response += `Content-Type: text/plain\r\n`;
                response += `Content-Length: ${body.length}\r\n`;
                response += `\r\n${body}`;
            } else if (urlpath.trim().startsWith('/user-agent')){
                var body = headers["User-Agent"];
                response = `HTTP/1.1 200 OK\r\n`;
                response += `Content-Type: text/plain\r\n`;
                response += `Content-Length: ${body.length}\r\n`;
                response += `\r\n${body}`;
            } else if (urlpath.trim().startsWith('/files/')){
                const requestedFile = path.join(directory, urlpath.substring('/files/'.length));
                console.log(`requestedFile: ${requestedFile}`);
                
                // read file if exists
                let fileExists = fs.existsSync(requestedFile);
                    
                if (fileExists) {
                    let body = fs.readFileSync(requestedFile);
                    response = 'HTTP/1.1 200 OK\r\n';
                    response += 'Content-Type: application/octet-stream\r\n';
                    response += `Content-Length: ${body.length}\r\n`;
                    response += `\r\n${body}`;
                } else {
                    response = 'HTTP/1.1 404 Not Found\r\n\r\n';
                }
            } else {        
              response = 'HTTP/1.1 404 Not Found\r\n\r\n';
            }
            break;
        
        case "POST":
            // parse headers
            for (var line of request.slice(1)) {
                // empty line marks end of headers
                if (line.trim() === '') break;
        
                // split line into key-value pair
                var [key, ...value] = line.trim().split(':');
                headers[key.trim()] = value.join(':').trim() // join(':') to recontruct values wich have : inside
            }
            // --- debug ---
            console.log(`headers:\n${JSON.stringify(headers)}`);
            if (urlpath.trim().startsWith('/files/')){
                const requestedFile = path.join(directory, urlpath.substring('/files/'.length));
                request = buffer.toString(); // I need original message
                // --- debug ---
                console.log(`POST requestedFile: ${requestedFile}`);
                console.log(`POST message: \n${request}\n^^^^^^\n`);
                
                // Extract file contents from the request body
                const bodyIndex = request.indexOf('\r\n\r\n');
                if (bodyIndex !== -1) {
                    const fileContents = request.substring(bodyIndex + "\r\n\r\n".length);
                    // --- debug ---
                    console.log(`POST body: ${fileContents}`);


                    // Save the file to the directory
                    fs.writeFileSync(requestedFile, fileContents);
                    response = 'HTTP/1.1 201 Created\r\n\r\n';
                } else {
                    response = 'HTTP/1.1 400 Bad Request\r\n\r\n';
                }
            } else {        
                response = 'HTTP/1.1 400 Bad Request\r\n\r\n';
            }    
            break;

        default:
            response = '501 Not Implemented';
    }

    socket.write(response);
    socket.end();
  });


  socket.on("close", () => {
    socket.end();
    //server.close();
  });
});

server.listen(4221, "localhost");
