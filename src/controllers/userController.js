
const userModel = require("../models/userModel")
const bcrypt=require('bcrypt')
const jwt=require("jsonwebtoken")
const aws = require('../AWS/aws')
const {
    isValid,
    phoneNumber,
    isValidEmail,
    isValidPincode,
    checkPassword,
    checkname,
    isValidString,
    isValidCity
   

} = require('../validations/validator')
const objectid = /^[0-9a-fA-F]{24}$/

const createUser = async function (req, res) {
    try {
        let data = req.body
        let address=data.address
        let requirefield = ["fname", "lname", "email", "phone", "password", "profileImage"]
        let err = []
        for (field of requirefield) {
            if (!data.hasOwnProperty(field)) {
                err.push(`${field} is mandatory in request body`)
                continue

            }
            if (!isValid(data[field])) {
                if (field === "phone") {
                    err.push(`value of ${field} must be String and conatai something`);
                    continue
                }
            }
            if (!isValid(data[field])) {

                err.push(`value of ${field} must be String and conatai something`);
                continue
            }

            if (field == 'fname') {
                if (!checkname(data.fname)) {
                    err.push("fname is invalid")
                    continue
                }
            }
            if (field == 'lname') {
                if (!checkname(data.lname)) {
                    err.push("lname is invalid")
                    continue
                }
            }
            if (field == "phone") {
                if (!phoneNumber(data.phone)) {
                    err.push("invalid phone number")
                }
            }
            if (field == 'password') {
                if (!checkPassword(data.password)) {
                    err.push(" password is invalid")
                }
            }
            if (field == "email") {
                if (!isValidEmail(data[field])) {
                    err.push("email is invalid");
                    continue

                }
            }
        }
       // address = JSON.parse(address)
        if (address) {
            if (typeof address != "object") return res.status(400).send({ status: false, message: "address is in incorrect format" })

            //*SHIPPING*    
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "shipping street is in incorrect format" })
                } else return res.status(400).send({ status: false, message: "address.shipping.street is required" })

                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "shipping city is in incorrect format" })
                } else return res.status(400).send({ status: false, message: "address.shipping.city is required" })

                if (address.shipping.pincode) {
                    if (typeof address.shipping.pincode != "number") return res.status(400).send({ status: false, message: "shipping pincode is in incorrect format" })
                    if (!isValidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be 6 characters long" })
                } else return res.status(400).send({ status: false, message: "address.shipping.pincode is required" })

            } else return res.status(400).send({ status: false, message: "address.shipping is required" })




            if (address.billing) {
                if (address.billing.street) {
                    if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "billing street is in incorrect format" })
                } else return res.status(400).send({ status: false, message: "address.billing.street is required" })

                if (address.billing.city) {
                    if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "billing city is in incorrect format" })
                } else return res.status(400).send({ status: false, message: "address.billing.city is required" })


                if (address.billing.pincode) {
                    if (typeof address.billing.pincode != "number") return res.status(400).send({ status: false, message: "billing pincode is in incorrect format" })
                    if (!isValidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be 6 characters long" })
                }

                else return res.status(400).send({ status: false, message: "address.billing.pincode is required" })

            } else return res.status(400).send({ status: false, message: "address.billing is required" })

        } else return res.status(400).send({ status: false, message: "address is required" })


        
        

        let checkEmail = await userModel.findOne({ email: data.email })
        if (checkEmail) {
            err.push("email is already register")
        }

        let checkPhone = await userModel.findOne({ phone: data.phone })
        if (checkPhone) {
            err.push("phone  is already register")
        }

        

        if (err.length > 0) {
            return res.status(400).send({ status: false, msg: err.join(",") })
        }

        const hashPassword = await bcrypt.hash("password", 10);
        req.body.password = hashPassword

      //===  ==================AWS==========================
      let profileImgUrl= await aws.uploadFile(files[0])
      data.profileImage=profileImgUrl
      //=====================================

        let createData = await userModel.create(data)
        return res.status(201).send({ status: true, data: createData })
    }
    catch (error) { return res.status(500).send({ status: false, msg: error.message }) }
}
//==========================================================================
const login = async function(req,res){
    try{
        const data =req.body
       const{email,password} = data
       //console.log(data)
       if(!email || !password)
       res.status(400).send({status:false, message:"Credential must be present"})

       let user = await userModel.findOne({email:email})
       console.log(user)
       if(!user){
       return res.status(400).send({status:false,message : "email is not correct"})
    }
       let checkPassword = await userModel.findOne({password:password})
       if(!checkPassword) {
       return res.status(400).send({status:false,message : "password is not correct"}) }


       const matchPass = bcrypt.compare(password, user.password);
        if (!matchPass) {
            return res.status(400).send({ status: false, message: "You Entered Wrong password" })
        }
       let token = jwt.sign(
        {
            userId: user._id.toString(),
            batch: "plutonium",
            organization: "FunctionUp",
        },
        "Project5-group4",
        {
            expiresIn: '72h'
        }
    );
    const finalData = {};
    finalData.userId = user._id;
    finalData.token = token
    res.status(201).send({ status: true, message: "User login successfully", token:{token: finalData} });


    }catch (error) {
        return res.status(500).send({ status: false, message: error.message});
}
}
//===========================================================================
const getUser = async function (req, res) {
    try {
        let id = req.params.userId
        if (!id) return res.status(400).send({ status: false, message: "id must be present in params" })
        if (!id.match(objectid)) return res.status(400).send({ status: false, message: "invalid userId" })

        const foundUser = await userModel.findOne({ _id: id })
        if (!foundUser) return res.status(404).send({ status: false, message: "user not found" })

        return res.status(200).send({ status: true, message: "User details", data: foundUser })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//=========================================================================

// const updateUser = async function(req,res){
//     try{
//         let userId = req.params.userId
//         let data = req.body
//         let {fname, lname, email, phone, password ,profileImage,address} = data
//        // let update = {}
//         // ------------ validation start -------------------
//         if(fname){
//             if(!isValid(fname)){
//                 res.status(400).send({ status:false, message: ' fname must be present' });
//             }
//             if(!checkname(fname)){
//                 return res.status(400).send({ status:false, message: 'plese provide valid  fname' });
//             }

//            // update.fname = fname
//         }
//         if(lname){
//             if(!isValid(lname)){
//                 res.status(400).send({ status:false, message: 'lname  must be present ' });
//             }
//             if(!checkname(lname)){
//                 return res.status(400).send({ status:false, message: ' plese provide valid lname' });
//             }
//             //update.lname = lname
//         }
//         if(email){
//             if(!isValid(email)){
//                 res.status(400).send({ status:false, message: ' email must be present ' });
//             }
//             if(isValidEmail(email)){
//                 return res.status(400).send({ status:false, message: 'plese provide valid email ' });
//             }}
//             if(password){
//                 if(!isValid(password)){
//                  return   res.status(400).send({ status:false, message: 'Invalid password' });
//                 }
//                 if(!checkPassword(password)){
//                     return res.status(400).send({status:false, message: 'plz provide valid password'})
//                 }
//                 const hashPassword = await bcrypt.hash("password", 10);
//                 req.body.password = hashPassword
        
//             }
//             if(profileImage){
//                 if(!isValid(profileImage)){
//                     res.status(400).send({ status:false, message: 'Invalid profileImage' });
//                 }

//                // update.profileImage = profileImage
//             }
//             address = JSON.parse(address)
//             if (address) {
//                 if (typeof address != "object") return res.status(400).send({ status: false, message: "address is in incorrect format" })
    
//                 //*SHIPPING*    
//                 if (address.shipping) {
//                     if (address.shipping.street) {
//                         if (!isValid(address.shipping.street)) return res.status(400).send({ status: false, message: "shipping street is in incorrect format" })
//                     } else return res.status(400).send({ status: false, message: "address.shipping.street is required" })
    
//                     if (address.shipping.city) {
//                         if (!isValid(address.shipping.city)) return res.status(400).send({ status: false, message: "shipping city is in incorrect format" })
//                     } else return res.status(400).send({ status: false, message: "address.shipping.city is required" })
    
//                     if (address.shipping.pincode) {
//                         if (typeof address.shipping.pincode != "number") return res.status(400).send({ status: false, message: "shipping pincode is in incorrect format" })
//                         if (!isValidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: "Pincode should be 6 characters long" })
//                     } else return res.status(400).send({ status: false, message: "address.shipping.pincode is required" })
    
//                 } else return res.status(400).send({ status: false, message: "address.shipping is required" })
    
    
    
    
//                 if (address.billing) {
//                     if (address.billing.street) {
//                         if (!isValid(address.billing.street)) return res.status(400).send({ status: false, message: "billing street is in incorrect format" })
//                     } else return res.status(400).send({ status: false, message: "address.billing.street is required" })
    
//                     if (address.billing.city) {
//                         if (!isValid(address.billing.city)) return res.status(400).send({ status: false, message: "billing city is in incorrect format" })
//                     } else return res.status(400).send({ status: false, message: "address.billing.city is required" })
    
    
//                     if (address.billing.pincode) {
//                         if (typeof address.billing.pincode != "number") return res.status(400).send({ status: false, message: "billing pincode is in incorrect format" })
//                         if (!isValidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: "Pincode should be 6 characters long" })
//                     }
    
//                     else return res.status(400).send({ status: false, message: "address.billing.pincode is required" })
    
//                 } else return res.status(400).send({ status: false, message: "address.billing is required" })
    
//             } else return res.status(400).send({ status: false, message: "address is required" })
    



//             existEmail = await userModel.findOne({email: email});
//             if(existEmail){
//                 res.status(400).send({ status:false, message: 'Email already present' });
//             }
//           //  update.email = email
//         }
        
//         if(phone){
//             if(!isValid(phone)){
//                 res.status(404).send({ status:false, message: 'Invalid phone' });
//             }
//             existPhone = await userModel.findOne({ phone: phone });
//             if(existPhone){
//                 res.status(400).send({ status:false, message: 'phone number already present' });
//             }
//            // update.phone = phone
//         }
       
//            // update.password = password
        
       
    

//         // -------------------- end -------------------
//         let updatedUser = await bookModel.findByIdAndUpdate(userId,{$set:update},{new:true})
//         res.status(200).send({ status: true,message: 'Success',data:updatedUser})
//     }
//     catch(err){
//        return res.status(500).send({status:false,message: err.message})
//     }





let updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files;

        let { fname, lname, email, password, phone } = data;
        //validating the request body
        if (isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to update your account data" });

        if (typeof fname == 'string') {
            //checking for firstName
            if (isValid(fname)) return res.status(400).send({ status: false, message: "First name should not be an empty string" });

            //validating firstName
            if (isValidString(fname)) return res.status(400).send({ status: false, message: "Enter a valid First name and should not contains numbers" });
        }
        if (typeof lname == 'string') {
            //checking for firstName
            if (isValid(lname)) return res.status(400).send({ status: false, message: "Last name should not be an empty string" });

            //validating firstName
            if (isValidString(lname)) return res.status(400).send({ status: false, message: "Enter a valid Last name and should not contains numbers" });
        }
        //validating user email-id
        if (data.email && (!isValidEmail(email))) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });

        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" });

        //validating user phone number
        if (data.phone && (!phoneNumber(phone))) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if email already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })

        if (data.password || typeof password == 'string') {
            //validating user password
            if (!checkPassword(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character" });

            //hashing password with bcrypt
        const hashPassword = await bcrypt.hash("password", 10);
        req.body.password = hashPassword

        }
        //aws
        if (files && files.length != 0) {
            let profileImgUrl = await aws.uploadFile(files[0]);
            data.profileImage = profileImgUrl;
        }
        if (data.address === "") {
            return res.status(400).send({ status: false, message: "Please enter a valid address" })
        } else if (data.address) {

            if (isValid(data.address)) {
                return res.status(400).send({ status: false, message: "Please provide address field" });
            }
            data.address = JSON.parse(data.address);

            if (typeof data.address !== "object") {
                return res.status(400).send({ status: false, message: "address should be an object" });
            }
            let { shipping, billing } = data.address

            if (shipping) {
                if (typeof shipping != "object") {
                    return res.status(400).send({ status: false, message: "shipping should be an object" });
                }

                if (validator.isValid(shipping.street)) {
                    return res.status(400).send({ status: false, message: "shipping street is required" });
                }

                if (validator.isValid(shipping.city)) {
                    return res.status(400).send({ status: false, message: "shipping city is required" });
                }

                if (!validator.isValidCity(shipping.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }

                if (validator.isValid(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "shipping pincode is required" });
                }

                if (!validator.isValidPincode(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid pincode" });
                }

            } else {
                return res.status(400).send({ status: false, message: "Shipping address is required" })
            }
            if (billing) {
                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "billing should be an object" });
                }

                if (validator.isValid(billing.street)) {
                    return res.status(400).send({ status: false, message: "billing street is required" });
                }

                if (validator.isValid(billing.city)) {
                    return res.status(400).send({ status: false, message: "billing city is required" });
                }
                if (!validator.isvalidCity(billing.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }

                if (validator.isValid(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "billing pincode is required" });
                }

                if (!validator.isValidPincode(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing pincode" });
                }
            } else {
                return res.status(400).send({ status: false, message: "Billing address is required" })
            }
        }
        let userData = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
        if (!userData) { return res.status(404).send({ status: false, message: "no user found to update" }) }
        return res.status(200).send({ Status: true, message: "success", data: userData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




//======================================================================

module.exports.createUser = createUser;
module.exports.login = login;
module.exports.getUser = getUser;
module.exports.updateUser=updateUser;

