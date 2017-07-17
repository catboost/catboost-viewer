var fs = require('fs'),
    path = require('path'),
    sourceDir = checkDir(process.argv[2]),
    targetDir = createDir(process.argv[3]);

fs.readdirSync(sourceDir).forEach(mockDir);

function mockDir(dir) {
    var sourceSubDir = path.join(sourceDir, dir);
    if(!fs.statSync(sourceSubDir).isDirectory()) return;

    fs.readdirSync(sourceSubDir).forEach(mockFile.bind(null, dir));
}

function mockFile(subDir, file) {
    if(!file.match(/(meta|learn_error|test_error|time_left)\.tsv$/)) return;

    var sourceFile = path.join(sourceDir, subDir, file);
    if(!fs.statSync(sourceFile).isFile()) return;

    var content = fs.readFileSync(sourceFile, 'utf8').split('\n'),
        targetFile = path.join(createDir(path.join(targetDir, subDir)), file),
        stream = fs.createWriteStream(targetFile, { flags : 'a' }),
        i = 0;

    stream.on('open', function() {
        console.log(targetFile + ' opened (source: ' + sourceFile + ')');
        var interval = setInterval(
            function() {
                stream.write(content[i++] + '\n');
                console.log(targetFile + ' writed');
                if(i === content.length) {
                    clearInterval(interval);
                    stream.end();
                    console.log(targetFile + ' closed');
                }
            },
            2000);
    });
}

function checkDir(dir) {
    if(!fs.existsSync(dir)) throw Error(dir + ' does not exist');
    if(!fs.statSync(dir).isDirectory()) throw Error(dir + ' is not directory');
    return dir;
}

function createDir(dir) {
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    return checkDir(dir);
}
