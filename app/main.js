const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    var request = data.toString().split('\r\n');
    var response = '';
    //check for path
    path = request[0].split(' ')[1];
    console.log(`Path: '${path}'`);
    if (path === '/') {
      response  = "HTTP/1.1 200 OK\r\n\r\n";
    } else if (path.trim().startsWith('/echo/')) {
        let echoContent = path.trim().substring('/echo/'.length);
        console.log(`echo: ${echoContent}`);
        var response = `HTTP/1.1 200 OK\r\n`;
        response += `Content-Type: text/plain\r\n`;
        response += `Content-Length: ${echoContent.length}\r\n`;
        response += `\r\n${echoContent}\r\n`;
    } else {        
      response = "HTTP/1.1 404 Not Found\r\n\r\n";
    }
    socket.write(response);
    socket.end();
  });
  socket.on("close", () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
