import { EmbedBuilder, EmbedType, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import BuildingDB from "../schemas/Building";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("showbuildings")
    .setDescription("Show any buildings in progress")
    ,
    execute: async (interaction) => {
        // Put all this information into the db
        try {
            // Construct the information
            await interaction.deferReply({});

            //await mongoose.connect(process.env.MONGO_URI);

            //console.log(mongoose.connections);
            // Connected, now to send data

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");
            
            

            const foundBuilding = await BuildingDB.find({});

            let embed = new EmbedBuilder()
            .setTitle("Buildings")

            if (!foundBuilding) 
            {
                embed.addFields(
                    {
                        name: "None",
                        value: ""
                    }
                )
            }
            else 
            {
                for (const building of foundBuilding) {
                    embed.addFields(
                        {
                            name: building.name,
                            value: `Tier: ${building.tier} \t Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                        }
                    )
                }
            }

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.editReply({embeds: [embed]});
            

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;