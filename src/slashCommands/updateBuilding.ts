import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, AnyComponentBuilder} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import BuildingDB from "../schemas/Building";
import { timeout } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("updatebuilding")
    .setDescription("Update a Building reminder")
    ,

    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await BuildingDB.find({});

            if (!buildings || buildings.length == 0){
                interaction.editReply({content: "There are no buildings to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }

            const embeds = [];
            const menus = [];

            let nembed = new EmbedBuilder()
            .setColor('Aqua')
            .setTitle("Buildings In Progress");

            let menu = new StringSelectMenuBuilder()
            .setCustomId("0-"+interaction.user.id)
            .setPlaceholder("No Building")

            let count= 0;
            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);
                if (count == 25) {
                    embeds.push(nembed);
                    nembed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setTitle("Buildings In Progress");
                    menus.push(menu);
                    menu = new StringSelectMenuBuilder()
                    .setCustomId(menus.length+"-"+interaction.user.id)
                    .setPlaceholder("No Building continued...")
                    count = 0;
                }
                nembed.addFields(
                    {
                    name: building.name.substring(0,50),
                    value: `Tier: ${building.tier} \t Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name.substring(0, 50)}, Weeks Left: ${building.time}, Owner: ${memb?.displayName}`,
                        value: building.name
                    }
                )
                count++;
            }
            embeds.push(nembed);
            menus.push(menu);

            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('One Week Decrease')
                    .setCustomId(`building-1week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Two Week Decrease')
                    .setCustomId(`building-2week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Instant Finish')
                    .setCustomId(`building-finishbuilding-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                ])

            // Button for each option, not for buildings

            const firstRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menus)

            interaction.editReply({embeds: [...embeds], components: [firstRow, secRow]})
            

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
            console.log(error);
        }
    }, cooldown: 10
}

export default command;