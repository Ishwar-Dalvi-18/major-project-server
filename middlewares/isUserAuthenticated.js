export const isUserAuthenticated = (req,res,next)=>{
    if(req.user){
        next()
    }else{
        next(new Error("Please Login. You are not authenticated"))
    }
}