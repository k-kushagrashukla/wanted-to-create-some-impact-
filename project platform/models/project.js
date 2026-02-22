const mongoose=require('mongoose');

const ProjectSchema=new mongoose.Schema({
    title:{type:String,required:true},
    description:String,
    techStack:[String],
    repoLink:String,
    liveLink:String,
    creatorId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    creatorName:String,
    creatorCollege:String,
    year:{type:Number,enum:[1,2,3,4],default:4},
    difficulty:{type:String,enum:['Beginner','Intermediate','Advanced'],default:'Intermediate'},
    packageGot:String,
    placementNotes:String,
    bannerURL:String
},{timestamp:true});

module.exports=mongoose.model('Project',ProjectSchema);