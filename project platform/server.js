require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const multer=require('multer');
const streamifier=require('streamifier');
const jwt=require('jsonwebtoken');

const user=require('./models/user');
const project=require('./models/project');
const authMiddleware= require('./middleware/auth');

const app=express();
app.use(cors());
app.use(express.json());

//connection
mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log('Mongodb connected'))
.catch(err=>console.error('Mongo error',err));

//multer memory storage for uplaods
const storage=multer.memoryStorage();
const upload= multer({storage});

//--Auth ROUTES --
app.post('/api/auth/register',async (req,res)=>{
    try{
        const {name,email,password,college}=req.body;
        const exists=await user.findOne({email});
        if(exists) return res.status(400).json({message:'Email already registerd'});
        const user=new User({name,email,password,college});
        await user.save();
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.json({token,user:{id:user._id, name:user.name,email:user.email,role:user.role}});
    } catch(err) {
        res.status(500).json({message: err.message});
    }
});

app.post('/api/auth/login',async (req,res)=>{
    try{
        const {email,password}=req.body;
        const user=await User.findOne({email});
        if(!user) return res.status(400).json({message:'Invalid Credentials'});
        const ok=await user.comparePassword(password);
        if (!ok) return res.status(400).json({message:'Invalid Credentials'});
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
    }catch(err){
        res.status(500).json({message:err.message});
    }
});

// upload avatar for profile
app.post('/api/upload/avatar',authMiddleware.auth, upload.single('image'), async (req,res)=>{
    try{
        if(!req.file) return res.status(400).json({message:'No file'});
        const buffer=req.file.buffer;
        const result=await new Promise((resolve,reject)=>{
            const stream=cloudinary.uploader.upload_stream({folder:'project_portfolio/avatars'},(err,res)=>{
                if (err) reject(err); else resolve(res);
            });
            streamifier.createReadStream(buffer).pipe(stream);
        });
        req.user.avatarUrl=result.secure_url;
        await req.user.save();
        res.json({url:result.secure_url});
    } catch(err){
        res.status(500).json({message:err.message});
    }
});

// upload project banner
app.post('/api/upload/avatar', authMiddleware.auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const buffer = req.file.buffer;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'project_portfolio/avatars' }, (err, res) => {
        if (err) reject(err); else resolve(res);
      });
      streamifier.createReadStream(buffer).pipe(stream);
    });
    req.user.avatarUrl = result.secure_url;
    await req.user.save();
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//create project (must be logged in)
app.post('/api/projects', authMiddleware.auth, upload.single('banner'), async (req, res) => {
  try {
    const body = req.body;
    const projectData = {
      title: body.title,
      description: body.description,
      techStack: body.techStack ? body.techStack.split(',').map(s => s.trim()) : [],
      repoLink: body.repoLink,
      liveLink: body.liveLink,
      creatorId: req.user._id,
      creatorName: req.user.name,
      creatorCollege: req.user.college,
      year: Number(body.year) || 4,
      difficulty: body.difficulty || 'Intermediate',
      packageGot: body.packageGot,
      placementNotes: body.placementNotes
    };

    if (req.file) {
      const buffer = req.file.buffer;
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'project_portfolio/banners' }, (err, res) => {
          if (err) reject(err); else resolve(res);
        });
        streamifier.createReadStream(buffer).pipe(stream);
      });
      projectData.bannerUrl = uploaded.secure_url;
    }

    const project = new Project(projectData);
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//GET projects with search , filters, sort, pagination
app.get('/api/projects', async (req, res) => {
  try {
    const { q, year, tech, sortBy, order, page, limit } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { creatorName: { $regex: q, $options: 'i' } }
    ];
    if (tech) filter.techStack = { $in: tech.split(',') };

    const sort = {};
    if (sortBy) sort[sortBy] = order === 'asc' ? 1 : -1;
    else sort.createdAt = -1;

    const p = Number(page) || 1;
    const lim = Number(limit) || 20;

    const total = await Project.countDocuments(filter);
    const data = await Project.find(filter).sort(sort).skip((p - 1) * lim).limit(lim);

    res.json({ total, page: p, limit: lim, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get single project
app.get('/api/projects/:id', async (req,res)=>{
    try{
        const p=await Project.findById(req.params.id);
        if (!p) return res.status(404).json({message:'Not found'});
        res.json(p);
    } catch (err){
        res.status(500).json({message:err.message});
    }
});

//ADMIN routes
app.get('/api/admin/users',authMiddleware.auth,authMiddleware.adminOnly, async(req,res)=>{
    const users=await User.find().select('-passoword');
    res.json(users);
});

app.post('/api/admin/promote', authMiddleware.auth, authMiddleware.adminOnly, async (req, res) => {
  const { userId } = req.body;
  const u = await User.findById(userId);
  if (!u) return res.status(404).json({ message: 'User not found' });
  u.role = 'admin';
  await u.save();
  res.json({ message: 'Promoted' });
});


app.delete('/api/admin/project/:id',authMiddleware.auth,authMiddleware.adminOnly,async (req,res)=>{
    await Project.findByIdAndDelete(req.params.id);
    res.json({message:'Deleted'});
});

//simple status
app.get('/',(req,res)=>res.send('API Running'));

const PORT= process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server started on ${PORT}`));