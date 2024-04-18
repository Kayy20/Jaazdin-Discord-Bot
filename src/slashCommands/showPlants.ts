import { EmbedBuilder, EmbedType, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import BuildingDB from "../schemas/Plant";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("showplants")
    .setDescription("Show any plants in progress")
    ,
    execute: async (interaction) => {
        // Put all this information into the db
        try {
            // Construct the information

            //await mongoose.connect(process.env.MONGO_URI);

            //console.log(mongoose.connections);
            // Connected, now to send data

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");
            
            

            const foundBuilding = await BuildingDB.find({});

            const embeds = [];

            let embed = new EmbedBuilder()
            .setTitle("Plants")
            .setColor('Green')

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
                let count = 0;
                for (const building of foundBuilding) {

                    if (count == 25) {
                        embeds.push(embed);
                        embed = new EmbedBuilder()
                        .setTitle("Plants Continued...")
                        .setColor('Green')
                        count = 0;
                    }

                    embed.addFields(
                        {
                            name: building.name,
                            value: `Weeks Left: ${building.time} \t Owner: ${userMention(building.user)} \t Repeatable? ${building.repeatable}`
                        }
                    )
                    count++;
                }
                embeds.push(embed);
            }

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.reply({embeds: embeds});
            

        } catch (error) {
            interaction.reply({content: error.message});
        }
    }, cooldown: 10
}

export default command;