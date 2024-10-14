export const userValidationUpdate = {
    _id:{
        notEmpty:{
            errorMessage:"id is mandatory"
        },
        isString:{
            errorMessage:"id must be of string type"
        }
    },
    image:{
        isString:{
            errorMessage:"image must be of base64 format"
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
    }
}