import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import PlantDB from "../schemas/Plant";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("addplant")
    .setDescription("Create a plant reminder in db with Weeks Left")
    .addStringOption(option => {
        return option
            .setName("name")
            .setDescription("Name of the Plant")
            .setRequired(true);
    })
    .addIntegerOption(option => {
        return option
            .setName("time")
            .setDescription("The amount of weeks left")
            .setRequired(true)
    })
    .addUserOption(option => {
        return option
            .setName("user")
            .setDescription("The user you want to mention")
            .setRequired(true)
    })
    .addUserOption(option => {
        return option
            .setName("repeatable")
            .setDescription("If it will automatically restart, true or false")
            .setRequired(true)
    })
    ,
    execute: async (interaction) => {
        // Put all this information into the db
        try {
            // Construct the information
            await interaction.deferReply({ephemeral: true});

            //await mongoose.connect(process.env.MONGO_URI);

            //console.log(mongoose.connections);
            // Connected, now to send data

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");


            // Since Plants are able to grow multiple at a time, we don't check whether it's a duplicate or not
            let building = new PlantDB({
                name: interaction.options.get("name")?.value, 
                time: interaction.options.get("time")?.value,
                user: interaction.options.get("user")?.value,
                repeatable: interaction.options.get("repeatable?")?.value,
                repeatTime: interaction.options.get("time")?.value,
            })

            await building.save();

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.editReply({content: `Successfully added plant ${interaction.options.get("name")?.value}`});
            

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;