import { Schema, model} from "mongoose";

const BuildingSchema = new Schema({
    name: {required:true, type: String},
    tier: {required:true, type: Number},
    time: {required:true, type: Number},
    user: {required:true, type: String}

},
{ 
    collection: 'Buildings'
})

const BuildingModel = model("Building", BuildingSchema)

export default BuildingModel