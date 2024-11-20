const { Command } = require('commander');
const program = new Command();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer();

program
  .option('-h, --host <type>', 'server host')
  .option('-p, --port <type>', 'server port')
  .option('-c, --cache <path>', 'cache directory')
  .parse(process.argv);
  
const option = program.opts();

if(!option.host){
    console.error("Please, specify the server address")
    process.exit(1);
}
if(!option.port){
    console.error("Please, specify the server port")
    process.exit(1);
}
if(!option.cache){
    console.error("Please, specify the path to the directory that will contain cached files")
    process.exit(1);
}
const { host, port, cache } = program.opts();
console.log(`Host: ${host}, Port: ${port}, Cache Directory: ${cache}`);

const cachePath = path.resolve(option.cache);
if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
    console.log(`Cache directory created at: ${cachePath}`);
} else {
    console.log(`Cache directory already exists at: ${cachePath}`);
}

const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
app.use(express.json());

server.listen(option.port, option.host, () => {
    console.log(`Server is running on http://${option.host}:${option.port}`);
});

app.get('/notes/:noteName', (req, res) => {
    const notePath = path.join(option.cache, req.params.noteName);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }

    const noteText = fs.readFileSync(notePath, 'utf8');
    res.send(noteText);
});

app.put('/notes/:noteName', (req, res) => {
    const notePath = path.join(option.cache, req.params.noteName);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }
    const newText = req.body.text;
    if (newText === undefined) {
        return res.status(400).send('Text is required');
    }
    fs.writeFileSync(notePath, newText);
    res.send('Note updated');
});

app.delete('/notes/:noteName', (req, res) => {
    const notePath = path.join(option.cache, req.params.noteName);

    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not found');
    }

    fs.unlinkSync(notePath);
    res.send('Note deleted');
});

app.get('/notes', (req, res) => {
    const files = fs.readdirSync(option.cache);
    const notes = files.map(fileName => {
        const text = fs.readFileSync(path.join(option.cache, fileName), 'utf8');
        return { name: fileName, text };
    });

    res.json(notes);
});

app.post('/write', upload.none(), (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
    const notePath = path.join(option.cache, noteName);
    if (fs.existsSync(notePath)) {
        return res.status(400).send('Note already exists');
    }
    try {
        fs.writeFileSync(notePath, noteText);
        res.status(201).send('Note created');
    } catch (error) {
        console.error('Error writing note:', error);
        res.status(500).send('Error creating note');
    }
});

app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
});