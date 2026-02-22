const express=require('express')
const multer=require('multer')
const path=require('path')
const fs=require('fs')

const app=express()

//ejs view engine
app.set('view engine','ejs')

//setting uplaods file as uploading file
app.use('/uploads',express.static('uploads'))

//multer setup
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'uploads/')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+ path.extname(file.originalname));
    },
})

const upload=multer({storage:storage})

//home route
app.get('/',(req,res)=>{
    const files=fs.readdirSync('./uploads')
    res.render('index',{files})
})

//upload route
app.post('/upload',upload.single('file'),(req,res)=>{
    console.log('uploaded:',req.file)
    res.redirect('/')
})

//download route
app.get('/download/:filename',(req,res)=>{
    const file=`./uploads/${req.params.filename}`;
    res.download(file);
})

app.listen(4000,()=>{
    console.log('server is running at localhost: 4000')
})