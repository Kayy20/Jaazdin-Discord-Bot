import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import ChannelDB from "../schemas/Channel";


const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("firsttimesetup")
    .setDescription("First Time Setup")
    .addChannelOption(option => {
        return option
            .setName("channel")
            .setDescription("Channel to send the weekly message to")
            .setRequired(true);
    })
    .addStringOption(option => {
        return option
            .setName("name")
            .setDescription("Name the Channel")
            .setRequired(true);
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
            
            

            let foundBuilding = await ChannelDB.findOne({});

            if (foundBuilding) {
                interaction.editReply({content: `First Time Setup Already Complete! ${foundBuilding.channel}`});
                return;
            }

            let channel = new ChannelDB({
                name: interaction.options.get("name")?.value,
                channel: interaction.options.get("channel")?.value,
            })

            await channel.save();

            interaction.editReply({content: `Bot Ready to go!`});
            

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;