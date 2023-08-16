import { EmbedBuilder, EmbedType, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import BuildingDB from "../schemas/Birthday";
import BirthdayModel from "../schemas/Birthday";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("showbirthdays")
    .setDescription("Show's the next 5 birthdays in order of who has the next birthday")
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
            .setTitle("Upcoming Birthdays")
            .setColor('Fuchsia')

            const now = new Date();
            now.setFullYear(2000);
            

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

                let birthdayList = foundBuilding;
                birthdayList.sort(function(a, b) {
                    return a.date > b.date ? 1 : -1;
                })

                //console.log(now)
                //console.log(birthdayList[0].date);

                // Sort the dates such that the current date is at the beginning

                let sortedList = [];
                let breakPoint = 0;

                for (let i = 0; i < birthdayList.length; i++) {
                    if (now < birthdayList[i].date){
                        // start converting the dates over
                        breakPoint = i;
                        break;
                    }
                }

                for (let i = breakPoint; i < birthdayList.length; i++){
                    sortedList[i - breakPoint] = birthdayList[i];
                }
                for (let i = 0; i < breakPoint; i++){
                    sortedList[i + (birthdayList.length - breakPoint)] = birthdayList[i];
                }
                //console.log(breakPoint);
                //console.log(sortedList);

                for (let building of sortedList) {
                    embed.addFields(
                        {
                            name: building.name,
                            value: `Current Age: ${building.age}    Birthday: ${building.date.getMonth() + 1 < 10 ? "0"+(building.date.getMonth() + 1) : building.date.getMonth() + 1}/${building.date.getDate() < 10 ? "0"+building.date.getDate() : building.date.getDate()}    Owner: ${userMention(building.user)}`
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
