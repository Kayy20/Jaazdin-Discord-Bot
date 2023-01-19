import { Schema, model } from "mongoose";

const ChannelSchema = new Schema({
    channel: {required:true, type: String},
},
{ 
    collection: 'Channels'
})

const ChannelModel = model("Channel", ChannelSchema)

export default ChannelModel