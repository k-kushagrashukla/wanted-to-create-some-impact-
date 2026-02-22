const express=require('express')
const multer=require('multer')
const path=require('path')
const fs=require('fs')

const app=express()
const PORT=3000

//view engine setup
app.set('view engine','ejs')

//static folders
app.use('/uploads',express.static('uploads'))
app.use('/public',express.static('public'))

//multer storage setup
const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'uploads/');
    },
    filename:(req,file,cb)=>{
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload=multer({storage})


//Route : Homepage
app.get('/',(req,res)=>{
    fs.readdir('uploads',(err,files)=>{
        if (err) return res.send('Error reading songs')
            const songs=files.filter(f=>f.endsWith('.mp3'))
        res.render('index',{songs})
    })
})

//upload page
app.get('/upload',(req,res)=>{
    res.render('upload')
})

app.post('/upload',upload.single('song'),(req,res)=>{
    res.redirect('/')
})

app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`)
})