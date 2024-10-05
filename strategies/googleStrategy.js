import passport from "passport";
import {OAuth2Strategy} from 'passport-google-oauth'

passport.use(new OAuth2Strategy({
    clientID : "481325303523-lucch7up39iodnccrbugb1aedlsfsqcl.apps.googleusercontent.com",
    clientSecret : "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",
    callbackURL : "/api/auth/google/callback"
},(acesssToken,refreshToken,profile,done)=>{
    done(null,profile)
}))