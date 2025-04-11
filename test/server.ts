import http from "http";

let status = "some great status";
let counter = 0;

console.log("ehllo server")

const server = http.createServer(function (req, res) {
  console.log("mark", req.method, req.url)

  if (req.method === "GET") {
    if (req.url === "/get_status") {

      res.write(status);
      res.end();
      return;
    } else if (req.url === "/get_number") {

      res.write(counter.toString());
      res.end();
      return;
    } else {
      res.write("<p>error 404<p>");
      res.end();
      return;
    }
  } else if (req.method === "POST") {
    let body = "";
    req.on("data", function (chunk) {
      body += chunk;
    });

    req.on("end", function () {
      if (req.url === "/put_status") {

        status = body.toString();
        res.write("aok");
        res.end();
        return;
      } else if (req.url === "/put_number") {

        counter = counter + parseInt(body);
        res.write(counter.toString());
        res.end();
        return;
      } else {
        res.write("<p>error 404<p>");
        res.end();
        return;
      }

      // res.writeHead(200, { "Content-Type": "text/html" });
      // res.end(body);
    });
  }
});

export default server;
