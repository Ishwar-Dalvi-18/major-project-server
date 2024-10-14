export const userValidationSchema = {
    image:{
        optional:true,
        isString:{
            errorMessage:"image must be of base64 format"
        }
    },
    name: {
        notEmpty: {
            errorMessage: "Username should not be empty"
        },
        isString: true,
        isLength: {
            options: { min: 3, max: 20 },
            errorMessage: "Name should contain characters between 3 to 20"
        }
    },
    email: {
        errorMessage: "Invalid Email Address",
        notEmpty: true,
        isEmail: true,
    },
    password: {
        notEmpty: {
            errorMessage: "password must not be empty",
        },
        isLength: {
            options: {
                min: 5,
                errorMessage: "Password must contain atleast 5 characters"
            }
        }
    },
    country: {
        notEmpty: {
            errorMessage: "country is mandatory"
        },
        isString: {
            errorMessage: "country should be in string format"
        },

    },
    state: {
        notEmpty: {
            errorMessage: "state is mandatory"
        },
        isString: {
            errorMessage: "state should be in string format"
        },


    },
    contact: {
        notEmpty: {
            errorMessage: "contact is mandatory"
        },
        isMobilePhone: {
            locale : 'en-IN',
            errorMessage: "contact must be in form of numbers",
        }
    },
    address : {
        notEmpty:{
            errorMessage:"Address is mandatory",
        },
        isString:true
    },
    role:{
        notEmpty:{
            errorMessage:"Role of user is mandatory",
        },
        isString : {
            errorMessage:"Role of user must be in string format"
        }
    }
}