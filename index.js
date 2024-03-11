var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    busboy = require('connect-busboy'),
    config = require('./config.json'),
    walk = require('walk'),

    app = express(),

    dir = path.join(__dirname, 'public'),

    domain = config.domain,
    password = config.password,
    port = config.port;

app.use('/', express.static(dir));
app.use(busboy());

app.get('/', function (req, res) {
    var ALLfiles = [];
    var walker = walk.walk('./public', { followLinks: false });
    var filesArray = [];

    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        filesArray.push(path.relative(path.join(__dirname, 'public'), path.join(root, stat.name)));
        next();
    });

    walker.on('end', function() {
        res.write('<!DOCTYPE html><html><head><title>File list</title></head><body>');

        res.write('<h1>File list:</h1><ul>');
        for (var i = 0; i < filesArray.length; i++) {
            res.write('<li>' + (i + 1) + '. https://cdn.voidline.rocks/' + filesArray[i] + ' <button onclick="copyToClipboard(\'' + "https://cdn.voidline.rocks/" + filesArray[i] + '\')">Copy</button></li>');
        }
        res.write('</ul>');

        res.write("<script>");
        res.write("function copyToClipboard(text) {");
        res.write("var input = document.createElement('textarea');");
        res.write("input.innerHTML = text;");
        res.write("document.body.appendChild(input);");
        res.write("input.select();");
        res.write("document.execCommand('copy');");
        res.write("document.body.removeChild(input);");
        res.write("}");
        res.write("</script>");

        res.write('</body></html>');
        res.end();
    });
});

app.post("/post", (req, res) => {
    let pass = req.query.password;
    if (!pass) return res.status(403).end();
    if (pass !== password) return res.status(403).end();

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', (fieldname, file, filename) => {

        let namefile = filename.filename.replace(/ /g, "_");

        console.log("Uploading: " + namefile + "\nFrom: " + req.ip);
        fstream = fs.createWriteStream(`${process.cwd()}/public/${namefile}`);
        file.pipe(fstream);

        fstream.on('finish', () => {
            res.status(200).send(`${domain}/${namefile}`)
        })
    })
});

app.listen(port, () => console.log("Ready!"));