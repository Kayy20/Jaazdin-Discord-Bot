import { Schema, model } from "mongoose";

const JobSchema = new Schema({
    name: {required:true, type: String},

},
{ 
    collection: 'Jobs'
})

const JobModel = model("Job", JobSchema)

export default JobModel