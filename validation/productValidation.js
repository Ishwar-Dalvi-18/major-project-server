export const productValidation = {
    'product.image':{
        in:['body'],
        notEmpty : {
            errorMessage:"Image of product is mandatory",
        },
        isString:{
            errorMessage:"Image should be base64 format"
        }
    },
    'product.name': {
        in: ['body'],
        notEmpty: {
            errorMessage: "name is mandatory"
        },
        isString: {
            errorMessage: "name must be of type number"
        }
    },
    'product.quantity.count': {
        in: ['body'],
        notEmpty: {
            errorMessage: "count is mandatory"
        },
        isNumeric: {
            errorMessage: "count must be of type number"
        }
    },
    'product.quantity.unit': {
        in: ['body'],
        notEmpty: {
            errorMessage: "unit is mandatory"
        },
        isString: {
            errorMessage: "unit must be of type string"
        }
    },
    'product.price.amount': {
        in: ['body'],
        notEmpty: {
            errorMessage: "amount is mandatory"
        },
        isNumeric: {
            errorMessage: "amount must be of type number"
        }
    },
    'product.price.unit': {
        in: ['body'],
        notEmpty: {
            errorMessage: "unit is mandatory"
        },
        isString: {
            errorMessage: "unit must be of type string"
        }
    },
    'product.price.currency': {
        in: ['body'],
        notEmpty: {
            errorMessage: "currency is mandatory"
        },
        isString: {
            errorMessage: "currency must be of type string"
        }
    }
}