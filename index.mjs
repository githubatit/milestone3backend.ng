import { config } from 'dotenv';
import express from "express";
import mongoose from 'mongoose';
import User from "./models/User.mjs";
import Blog from "./models/Blog.mjs";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import cookieParser from 'cookie-parser';

config();
const app=express();

app.use(express.json());
app.use(cors({
    origin: true, 
    credentials: true,
  }));
app.use(cookieParser());

const URI=process.env.URI
mongoose.connect(
    URI,
    {useNewUrlParser:true})
    .then(()=>{
        console.log("Connected to MongoDB");
    })
    .catch(()=>{
        console.log("Couldn't connect to MongoDB");
    })


app.post('/register',async (req,res)=>{
    const{username,email,password}=req.body;
    try {
        console.log(username);
        console.log(email);
        console.log(password);
        const user=await User.findOne({username:username})
        if(user) return res.status(400).json({msg:"The Email Already Exists"})
        console.log(user);
        const hashedpass= await bcrypt.hash(password,10);

        const userDoc=await User.create(
            {username:username,
             email:email,
             password:hashedpass
            });
        console.log(userDoc);
        res.json(userDoc);        
    } catch (e) {
        res.status(400).json(e.message);
    }
})

app.post('/login', async (req,res)=>{
    try {
        const {username,password}=req.body
        const user=await User.findOne({username:username})
        if(!user) return res.status(400).json({msg:"User does not exists"})
        const isMatched= await bcrypt.compare(password,user.password)
        if(!isMatched) return res.status(400).json({msg:"Incorrect Password"})
        const payload={username,id:user._id}
        const token=jwt.sign(payload,process.env.secret,{expiresIn:"1d"})
        res.cookie('token',token).json("OK");
    } catch (err) {
        return res.status(500).json({msg:err.message})
    }
})

app.get('/Blogs', async (req,res)=>{
    try {
        const Blogs=await Blog.find();
        res.json(Blogs);
    } catch (err) {
        return res.status(500).json({err:"Error"});
    }  
})

app.post('/CreateBlog', async (req,res)=>{
    try {
       const {title,desc,username}=req.body;
       console.log(req.body);
       const newBlog=Blog({
        title:title,
        description:desc,
        username:username
       })
       await newBlog.save();
        res.json({"msg":"Scuccessfully Created"});
        } catch (err) {
        return res.status(500).json({msg:err.message})
    }
})

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; 
  
    if (!token) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
  
    jwt.verify(token, process.env.secret, (err, user) => {
      if (err) {
        return res.status(403).json({ msg: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  };

app.put('/UpdateBlog/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, username } = req.body;
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({ msg: 'Blog post not found' });
    }

    existingBlog.title = title;
    existingBlog.description = description;
    existingBlog.username = username;

    await existingBlog.save();

    res.json({ msg: 'Successfully updated blog post' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});


app.listen(process.env.PORT || 5000,()=>{
 console.log("SERVER IS LISTENING ON PORT 5000")   
});