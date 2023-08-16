import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, AnyComponentBuilder, Guild} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import BuildingDB from "../schemas/Birthday";
import { timeout } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("updatebirthday")
    .setDescription("Update a Birthday information")
    ,

    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            let member = interaction.guild?.members.fetch(interaction.user);
            let mod = false;
            if (member)
            {
                if ((await member).roles.cache.some(role => role.name === 'Bot Overlord') || (await member).roles.cache.some(role => role.name === 'GM')){
                    mod = true;
                }
            }
            
            let buildings = await BuildingDB.find({});
            if (!mod) buildings = await BuildingDB.find({user: interaction.user.id});

            if (!buildings || buildings.length == 0){
                interaction.editReply({content: "There are no birthdays to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }


            let nembed = new EmbedBuilder()
            .setColor('Aqua')
            .setTitle("Birthdays");

            const menu = new StringSelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder("No Birthday")

            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);

                nembed.addFields(
                    {
                    name: building.name.substring(0,50),
                    value: `Age: ${building.age},   Birthdate: ${building.date.getMonth() + 1 < 10 ? "0"+(building.date.getMonth() + 1) : building.date.getMonth() + 1}/${building.date.getDate() < 10 ? "0"+building.date.getDate() : building.date.getDate()}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name.substring(0, 50)}`,
                        value: building.name
                    }
                )
                
            }

            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('Change Birthdate')
                    .setCustomId(`birthday-date-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Change Age')
                    .setCustomId(`birthday-age-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Delete')
                    .setCustomId(`birthday-delete-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                ])

            // Button for each option, not for buildings

            const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menu)

            interaction.editReply({embeds: [nembed], components: [firstRow, secRow]})
            

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
            console.log(error);
        }
    }, cooldown: 10
}

export default command;