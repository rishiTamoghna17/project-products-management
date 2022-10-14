const productModels = require('../models/productModel')
const validator = require("../validations/validator")
const aws = require('../AWS/aws')

const createProduct = async function (req, res) {
    try {

        let data = req.body
        let files = req.files

        if (validator.isValid(data)) {
            return res.status(400).send({ status: false, msg: "body is empty" })
        }
        let { title, description, price, currencyId, currencyFormat, installments, isFreeShipping, style } = data


        // i
        if (!title) {
            return res.status(400).send({ status: false, msg: "title is mandatory" })


        }
        const titlepresent = await productModels.findOne({ title: title })
        if (titlepresent) {
            return res.status(400).send({ status: false, msg: "title is already exist" })

        }
        if (!description) {
            return res.status(400).send({ status: false, msg: "description is mandetory" })
        }
        if (!validator.isValid1(description)) {
            return res.status(400).send({ status: false, msg: "description is plz provide valid" });
        }
        if (!price) {
            return res.status(400).send({ status: false, msg: "price is mandetory" })
        }





        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, msg: "please prvide valid price" })
        }
        // regex for price
        if (!currencyId) {

            return res.status(400).send({ status: false, msg: "currencyId is mandetory" })
        }
        if (currencyId !== "INR") {
            return res.status(400).send({ status: false, msg: "plese provide valid currencyId only INR" })
        }
        if (!currencyFormat) {

            return res.status(400).send({ status: false, msg: "currencyFormat is mandetory" })
        }
        if (currencyFormat !== "₹") {

            return res.status(400).send({ status: false, msg: "currencyFormat is invalid" })
        }

        //regex for  curencyId

        //productImage


        // if(!validator.isValid1(productImage)){
        //     return res.status(400).send({status:false ,msg:" productImage is plz provide valid"});
        // }


        if (!data.availableSizes) {

            return res.status(400).send({ status: false, msg: "availableSizes is mandetory" })
        }


        availableSizes = data.availableSizes.split(",")

        for (let i = 0; i < availableSizes.length; i++) {


            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i])) {

                return res.status(400).send({ status: false, msg: "size note availevel" })
            }
            data.availableSizes = availableSizes

        }

        // if(validator.isValidString(currencyFormat)){
        //     return res.status(400).send({status:false ,msg:"currencyFormat must should be ₹ "})
        // }

        if (installments) {


            if (!Number(installments)) {
                return res.status(400).send({ status: false, msg: "installments ony accept in intiger number " })
            }
        }
        if (isFreeShipping) {


            if (isFreeShipping !== "boolean") {
                return res.status(400).send({ status: false, msg: `isFreeShipping is noly accept true & false ` })
            }
        }

        if (validator.isValidString(style)) {
            return res.status(400).send({ status: false, msg: `please provide corect style ` })
        }



        //==============================================================
        if (data.productImage) {
            return res.status(400).send({ status: false, msg: "productImage is only file accept" })
        }

        if (!files) {
            return res.status(400).send({ status: false, msg: "productImage is mandetory" })
        }

        let productImgUrl = await aws.uploadFile(files[0])
        data.productImage = productImgUrl



        //=========================================================



        let allproduct = await productModels.create(data)

        return res.status(201).send({ status: true, data: allproduct })


    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createProduct }