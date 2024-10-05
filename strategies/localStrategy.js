import passport from "passport";
import { Strategy } from "passport-local";
import { User } from "../models/user.js";
import { compareNormalPassWithHashedPass } from "../utils/passwordEncrption.js";
import { language } from "../globals.js";
import { NewUser } from "../models/newuser.models.js";

passport.serializeUser((user,done)=>{
    console.log("Serialize")
    console.log(user)
    done(null,user)
})

passport.deserializeUser((user,done)=>{
    console.log("Deserialize")
    console.log(user)
    done(null,user)
})
passport.use(new Strategy({
    usernameField : "email"
},async(username , password , done)=>{
    try{
    const found_user = await NewUser.findOne({email : username});
    if(found_user){
        const isPasswordCorrect = compareNormalPassWithHashedPass(password,found_user.password);
        if(isPasswordCorrect){
            done(null,found_user);
        }else{
            console.log(language())
            if(language()==="en"){
                done(new Error("Incorrect email or password"),null);
            }else if(language()==="mr"){
                done(new Error("चुकलेला ईमेल किंवा पासवर्ड"),null)
            }else if(language()=== "hi"){
                done(new Error("गलत ईमेल या पासवर्ड"),null)
            }
            
        }        
    }
    else{
        if(language()==="en"){
            done(new Error("Incorrect email or password"),null);
        }else if(language()==="mr"){
            done(new Error("चुकलेला ईमेल किंवा पासवर्ड"),null)
        }else if(language()=== "hi"){
            done(new Error("गलत ईमेल या पासवर्ड"),null)
        }
    }} catch(err){
        done(err,null)
    }
}))