import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../models/user.js";
import { compareNormalPassWithHashedPass } from "../utils/passwordEncrption.js";


passport.serializeUser((user,done)=>{
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    done(null,user)
})

passport.use(new Strategy({
    usernameField : "email"
},async(username , password , done)=>{
    try{
    const found_user = await User.findOne({email : username});
    if(found_user){
        const isPasswordCorrect = compareNormalPassWithHashedPass(password,found_user.password);
        if(isPasswordCorrect){
            done(null,found_user);
        }else{
            done(null,false,{message:"Incorrect email or password"});
        }        
    }
    else{
        done(null,false,{message:"Incorrect email or password"});
    }} catch(err){
        done(err,null)
    }
}))