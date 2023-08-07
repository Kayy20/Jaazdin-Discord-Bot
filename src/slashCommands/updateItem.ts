import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, AnyComponentBuilder} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import ItemDB from "../schemas/Item";
import { timeout } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("updateitem")
    .setDescription("Update an Item reminder")
    ,

    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await ItemDB.find({});

            if (!buildings || buildings.length == 0){
                interaction.editReply({content: "There are no items to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }


            let nembed = new EmbedBuilder()
            .setColor('Aqua')
            .setTitle("Items In Progress");

            const menu = new StringSelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder("No Item")

            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);
                console.log(building.name);
                nembed.addFields(
                    {
                    name: building.name,
                    value: `Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name}, Weeks Left: ${building.time}, Owner: ${memb?.displayName}`,
                        value: building.name
                    }
                )
                
            }

            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('One Week Decrease')
                    .setCustomId(`item-1week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Two Week Decrease')
                    .setCustomId(`item-2week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Instant Finish')
                    .setCustomId(`item-finishitem-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                ])

            // Button for each option, not for buildings

            const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menu)

            interaction.editReply({embeds: [nembed], components: [firstRow, secRow]})
            

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
        }
    }, cooldown: 10
}

export default command;