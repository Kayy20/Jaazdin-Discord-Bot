import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import mongoose from "mongoose";
import BuildingDB from "../schemas/Birthday";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("addbirthday")
    .setDescription("Create a Birthday reminder")
    .addStringOption(option => {
        return option
            .setName("name")
            .setDescription("Name of the Building")
            .setRequired(true);
    })
    .addIntegerOption(option => {
        return option
            .setName("age")
            .setDescription("Current Age of the character")
            .setRequired(true)
    })
    .addIntegerOption(option => {
        return option
            .setName("month")
            .setDescription("What month was the character born in? (1-12)")
            .setRequired(true)
    })
    .addIntegerOption(option => {
        return option
            .setName("day")
            .setDescription("What day of the month was the character born in? (1-31)")
            .setRequired(true)
    })
    .addUserOption(option => {
        return option
            .setName("user")
            .setDescription("The user of the character")
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
                interaction.editReply({content: "Birthday is already in db, try the command: updateBirthday instead"});
                return;
            }

            let building = new BuildingDB({
                name: interaction.options.get("name")?.value, 
                age: interaction.options.get("age")?.value,
                user: interaction.options.get("user")?.value,
            })

            let tempA = new BuildingDB({
                age: interaction.options.get("month")?.value
            })
            let tempB = new BuildingDB({
                age: interaction.options.get("day")?.value
            })

            console.log(tempA.age);
            console.log(tempB.age);

            building.date = new Date();
            building.date.setFullYear(2000);
            building.date.setMonth(tempA.age - 1);
            building.date.setDate(tempB.age);
            building.date.setHours(0, 0, 0, 0);

            await building.save();

            // Insert a new entry into the collection
            //let res = await mongoose.connection.db.collection("Buildings").insertOne(docs);
            
            interaction.editReply({content: `Successfully added birthday of ${interaction.options.get("name")?.value}`});
            

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;