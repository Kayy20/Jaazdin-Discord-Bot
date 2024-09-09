import { ModalBuilder, Events, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import JobDB from "../schemas/Job";
import { job } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("jobreward")
    .setDescription("Congradulations you get something!")
    ,
    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await JobDB.find({});

            if (!buildings || buildings.length == 0){
                interaction.editReply({content: "There are no jobs!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }

            const menus = [];
            let jobMenus = new StringSelectMenuBuilder()
            .setCustomId('0-'+interaction.user.id)
            .setPlaceholder('Select your job');

            let count = 0;
            console.log(buildings.length);
            for (const i of buildings){

                if (count == 25) {
                    menus.push(jobMenus);
                    jobMenus = new StringSelectMenuBuilder()
                    .setCustomId(menus.length+'-'+interaction.user.id)
                    .setPlaceholder('Select your job continued...')
                    count = 0;
                }

                jobMenus.addOptions(
                    {
                        label: i.name,
                        value: i.name
                    }
                )

                count++;
            }
            menus.push(jobMenus);
            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('Cancel')
                    .setCustomId(`job-cancel-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Danger)
                    ,
                    new ButtonBuilder()
                    .setLabel('Continue')
                    .setCustomId(`job-continue-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Success)
                ]
            )

            const firstRow = [];
            for (let i = 0; i < menus.length; i++){
                firstRow.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menus[i]));

            } 
            interaction.editReply({components: [...firstRow, secRow]})

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
        }
    }, cooldown: 10
}

export default command;