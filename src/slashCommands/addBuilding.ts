import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import BuildingDB from "../schemas/Building";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("addbuilding")
    .setDescription("Create a Building reminder in db with Tier and Weeks Left")
    .addStringOption(option => {
        return option
            .setName("name")
            .setDescription("Name of the Building")
            .setRequired(true);
    })
    .addIntegerOption(option => {
        return option
            .setName("tier")
            .setDescription("The current Tier of the Building")
            .setRequired(true)
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
            
            

            let foundBuilding = await BuildingDB.findOne({ name: interaction.options.get("name")?.value});

            if (foundBuilding) {
                interaction.editReply({content: "Building is already in db, try the command: updateBuilding instead"});
                return;
            }

            let building = new BuildingDB({
                name: interaction.options.get("name")?.value, 
                tier: interaction.options.get("tier")?.value,
                time: interaction.options.get("time")?.value,
                user: interaction.options.get("user")?.value,
            })

            await building.save();

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.editReply({content: `Successfully added building ${interaction.options.get("name")?.value}`});
            

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;