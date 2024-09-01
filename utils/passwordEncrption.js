import {compareSync, genSaltSync,hashSync} from 'bcrypt'

export const encryptPassword = (normalPassword)=>{
    const rounds = 10 ;
    const salt = genSaltSync(rounds);
    const hashedPassword = hashSync(normalPassword,salt);
    return hashedPassword;
}

export const compareNormalPassWithHashedPass = (normalPassword , hashedPassword)=>{
    const result = compareSync(normalPassword,hashedPassword);
    return result;
}