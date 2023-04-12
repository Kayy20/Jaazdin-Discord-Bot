import { Schema, model} from "mongoose";

const ItemSchema = new Schema({
    name: {required:true, type: String},
    time: {required:true, type: Number},
    user: {required:true, type: String}

},
{ 
    collection: 'Items'
})

const ItemModel = model("Items", ItemSchema)

export default ItemModel