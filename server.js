const express = require('express');
const app = express();
const compression = require('compression');
const path = require('path')
const saltedMd5 = require('salted-md5')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })
require("dotenv").config();

const port = process.env.port

app.use(express.urlencoded())
app.use(express.json());
app.use(compression())

// connection with firebase
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.bucket_path
});
app.locals.bucket = admin.storage().bucket()
let db = admin.firestore();
let user = db.collection('users');

// insert(create) data 
app.post('/insert', async(req, res) => {
    const data = req.body;
    await user.add(data);
    res.status(200).json({
        msg: "data is save...",
        status: 200
    });
});

// view(read) data 
app.get('/view', async(req, res) => {
    const data = await user.get();
    const list = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
        msg: "data is display...",
        status: 200,
        data: list
    });
});

// update data 
app.post('/update', async(req, res) => {
    const id = req.body.id;
    delete req.body.id;
    const data = req.body;
    await user.doc(id).update(data);
    res.status(200).json({
        msg: "data is updated...",
        status: 200
    });
});

// delete data 
app.post('/delete', async(req, res) => {
    const id = req.body.id;
    await user.doc(id).delete();
    res.status(200).json({
        msg: "data is deleted...",
        status: 200
    });
});

//Upload file using bucket
app.post('/upload', upload.single('file'), async(req, res) => {
    const name = saltedMd5(req.file.originalname, 'SUPER-S@LT!')
    const fileName = name + path.extname(req.file.originalname)
    await app.locals.bucket.file(fileName).createWriteStream().end(req.file.buffer)
    res.status(200).json({
        msg: "file is uploaded...",
        status: 200
    });
})

app.listen(port, () => {
    console.log(` server is Running on ${port}`);
})