import { config } from "dotenv";
config({
    path:"C:\\Users\\Ishwar Dalvi\\Desktop\\major project server\\config.env",
});

import express, { response } from 'express';
import { Server } from "socket.io";
import mongoose from "mongoose";
import { checkSchema, matchedData, validationResult } from "express-validator";
import { userValidationSchema } from "./validation/UserValidationSchema.js";
import { compareNormalPassWithHashedPass, encryptPassword } from "./utils/passwordEncrption.js";
import { User } from "./models/user.js";
import emailExistence from 'email-existence';
import cors from 'cors';
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./strategies/googleStrategy.js"
import "./strategies/localStrategy.js"

const port = process.env.PORT||8000;
const app = express();
app.use(express.json());
app.use(cors({
    origin:["http://192.168.0.224:5173","http://localhost:5173"],
    credentials : true,
    methods : ["GET" , "POST" , "DELETE" , "PUSH"],
}))

mongoose.connect("mongodb://localhost:27017/major-project").then(db=>{
    console.log(`Connection to database successfull`);
})

app.use(session({
    secret :"ISHWAR",
    saveUninitialized : false,
    resave : false,
    store : MongoStore.create({
        client : mongoose.connection.getClient()
    })
}))

app.use(passport.initialize());
app.use(passport.session());



const httpServer = app.listen(port,()=>{
    console.log(`server is running on port : ${port}`);
}) 
const io = new Server(httpServer,{
    cors:{
        origin:"*",
        methods : ["GET" , "POST" , "DELETE" , "PUSH"],
        allowedHeaders:true
    }
});
io.on("connection", socket=>{
    console.log(`One client connected : ${socket.id}`);
})

app.get("/api/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get("/api/auth/google/callback", passport.authenticate('google', {
    successRedirect: "http://localhost:5173/profile",
    failureRedirect: "http://localhost:5173/login"
}))
app.post("/api/user/login",async(req,res,next)=>{
    console.log("User made a request")
    passport.authenticate('local',(err,user,info)=>{
        if(err){
            return next(err)
        }
        if(!user){
            return next(new Error(info.message));
        }
        if(user){
            return res.json({
                response : {
                    type : true,
                    msg : "You logged in successfully",
                    user
                }
            })
           }
    })(req,res,next);
   
})
app.get("/api/user",(req,res)=>{
    console.log(req.user)
    if(req.user){
        res.json({
            response : {
                user : req.user
            }
        })
    }else{
        res.json({
            response : {}
        })
    }
})
app.post("/api/user",checkSchema(userValidationSchema),async(req,res,next)=>{
    const result = validationResult(req);
    const data = matchedData(req);
    console.log(data)
    console.log(result);
    if(result.errors.length > 0){
        next(new Error("some errors in email and password or name"));
    }
    const { email , password , name }= data ;
    console.log(`email : ${email} password : ${password}`);
    const does_user_exist =await User.findOne({email : email});
    if(does_user_exist){
        next(new Error("User with same email already exists"));
    }else{
    emailExistence.check(email,async(err,response)=>{
        if(response===true){
            const encryptedPassword = encryptPassword(password);
            const model_result = await User.create({
                name : name,
                email : email,
                password : encryptedPassword,
            })
            await model_result.save();
            
            res.json({
                response : {
                    type:true,
                    msg : "You signed up successfully",
                }
            })
        }else{
            next(new Error("Email you have entered does not exist"));
        }
        
    })}
})

app.use((err,req,res,next)=>{
    res.json({
        response : {
            type : false,
            msg : err.message
        }
    })
})


