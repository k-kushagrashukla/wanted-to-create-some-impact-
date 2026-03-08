const mongoose=require('mongoose')

const ExperienceSchema=new mongoose.Schema({
    name:{type:String,required:true},
    batch:String,
    company:{type:String,required:true},
    role:String,
    description:{type:String,required:true},
    category: String, // added category for tech / non-tech
    createdAt:{type:Date,default:Date.now}
})

module.exports=mongoose.model("experience",ExperienceSchema)