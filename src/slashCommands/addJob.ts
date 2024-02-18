import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import JobDB from "../schemas/Job";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("addjob")
    .setDescription("add a new job")
    //.setDefaultMemberPermissions(3)
    .addStringOption(option => {
        return option
            .setName("name")
            .setDescription("Name of the Job")
            .setRequired(true);
    }),
    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        if (interaction.channel?.id != "1065465368077946912"){
            interaction.reply({content: `There is a time and place for everything, but not now`, ephemeral: true})
            
            return;
        }
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            let foundBuilding = await JobDB.findOne({ name: interaction.options.get("name")?.value});

            if (foundBuilding) {
                interaction.editReply({content: "Job is already in database"});
                return;
            }

            let building = new JobDB({
                name: interaction.options.get("name")?.value, 
            })

            await building.save();

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.editReply({content: `Successfully added job ${interaction.options.get("name")?.value}`});

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
        }
    }, cooldown: 2
}

export default command;