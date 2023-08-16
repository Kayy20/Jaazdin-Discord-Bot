import { Schema, model} from "mongoose";

const BirthdaySchema = new Schema({
    name: {required:true, type: String},
    date: {required:true, type: Date},
    age: {required:true, type: Number},
    user: {required:true, type: String}

},
{ 
    collection: 'Birthdays'
})

const BirthdayModel = model("Birthday", BirthdaySchema)

export default BirthdayModel