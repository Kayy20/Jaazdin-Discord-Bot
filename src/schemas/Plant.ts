import { Schema, model } from "mongoose";

const PlantSchema = new Schema({
    name: {required:true, type: String},
    time: {required:true, type: Number},
    user: {required:true, type: String}

},
{ 
    collection: 'Plants'
})

const PlantModel = model("Plant", PlantSchema)

export default PlantModel