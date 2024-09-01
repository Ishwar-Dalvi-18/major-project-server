export const userValidationSchema = {
    name :{
        notEmpty : {
            errorMessage:"Username should not be empty"
        },
        isString : true,
        isLength : {
            options : {min : 3 , max:20},
            errorMessage : "Name should contain characters between 3 to 20"
        }
    },
    email : {
        errorMessage : "Invalid Email Address",
        notEmpty : true,
        isEmail : true,
    },
    password : {
        notEmpty : {
            errorMessage : "password must not be empty",
        },
        isLength : {
            options : {
                min : 5,
                errorMessage : "Password must contain atleast 5 characters"
            }
        }
    }
}