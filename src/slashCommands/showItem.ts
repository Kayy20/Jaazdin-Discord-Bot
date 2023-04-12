import { EmbedBuilder, EmbedType, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import ItemDB from "../schemas/Item";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("showitems")
    .setDescription("Show any items in progress")
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
            
            

            const foundBuilding = await ItemDB.find({});

            let embed = new EmbedBuilder()
            .setTitle("Items")
            .setColor('Purple')

            if (!foundBuilding) 
            {
                embed.addFields(
                    {
                        name: "None",
                        value: "Nothing here to see"
                    }
                )
            }
            else 
            {
                for (const building of foundBuilding) {
                    embed.addFields(
                        {
                            name: building.name,
                            value: `Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
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