import express from 'express';
import axios from 'axios'
import { Client, Intents, MessageEmbed } from 'discord.js'

import { getDivBy4Floor } from './divisible4.mjs'

const server = express()
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

let test_channel
let sales_channel 
let welcome_channel 

client.on("ready", async (client) => {
    console.log(`Logged in as ${client.user.tag}!`);

    test_channel = await client.channels.fetch("911638845626388540");
    sales_channel = await client.channels.fetch("910628753057648650");
    welcome_channel = await client.channels.fetch("897309381094416426");

    let channel = client.channels.cache.get("910628753057648650");

    const options = {
        method: 'GET',
        url: 'https://api.opensea.io/api/v1/assets?asset_contract_address=0xc631164b6cb1340b5123c9162f8558c866de1926&order_by=sale_date&order_direction=desc&offset=0&limit=1',
    };

    // Check OS for most recent sale every 5 minutes
    setInterval(() => {
        // Fetch most recent OS sale 
        axios.request(options).then(function (response) {
            let sale = response.data.assets[0];
            let price = sale.last_sale.total_price * "0.000000000000000001";

            // Create Discord embed message
            const lastSale = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(sale.token_id + " - " + sale.asset_contract.name)
                .setURL(sale.permalink)
                .addFields(
                    { name: 'Price', value: price.toString().substring(0, 5) },
                    { name: 'Buyer', value: sale.last_sale.transaction.from_account.address }
                )
                .setImage(sale.image_url);
              
            // Fetch last OS alert and check if token id matches most recent sale
            channel.messages.fetch({ limit: 1 }).then(messages => {
                let lastMessage = messages.first()
                // console.log(lastMessage.embeds[0].title.split(" ")[0]);
                // console.log(sale.token_id)
                if (lastMessage.embeds[0].title.split(" ")[0] === sale.token_id) {
                    return
                } else {
                    channel.send({ embeds: [lastSale] });
                }
            }).catch(console.error);

        }).catch(function (error) {
            console.error(error);
        });
    }, 300000);

});

 

let mostRecentRecordedSaleID = undefined
client.on("messageCreate", async msg => {
    // Process only commands
    if (msg.content.charAt(0) !== '!') { return }

    let args = msg.content.slice(1).split(' ');
    let command = args.shift();
    command = command.toLowerCase()

    if (command === 'floor') {
        const res = await axios('https://api.opensea.io/collection/divineanarchy')
        const floorPrice = JSON.stringify(await res.data.collection.stats.floor_price)
        if (floorPrice) {
            msg.reply(floorPrice)
        }
    }

    else if (command === 'claim') {
        let userDemandedRole = args[0].toLowerCase()
        if (userDemandedRole === 'admin') {
            msg.reply("You don't have permissions for that.")
            return
        }
        let roleObject = msg.guild.roles.cache.find(r => r.name.toLowerCase() === userDemandedRole);
        if (roleObject) {
            let member = msg.member;
            if (member.roles.cache.has(roleObject.id)) {
                msg.reply("This role has already been claimed.")
            } else {
                member.roles.add(roleObject).catch(console.error);
                msg.reply('Role Added!')
            }
        }
        else {
            msg.reply("Role doesn't exist.")
        }
    }

    else if (command === 'test') {
        const options = {
            method: 'GET',
            url: 'https://api.opensea.io/api/v1/assets?asset_contract_address=0xb48eb7b72ff5a4b5ef044ea9e706c990bb33884d&order_by=sale_date&order_direction=desc&offset=0&limit=10',

            
            // 0xc631164b6cb1340b5123c9162f8558c866de1926
        };
        const tryLogLastSales = async () => {
            const assets = (await axios.request(options)).data.assets
            // Newest sales come first
            for (let i = 0; i < assets.length; i++) {
                // If this asset has already been loged break out
                // Later to this should have also been logged
                if (assets[i].token_id === mostRecentRecordedSaleID) {
                    break
                }
                if (i === 0) { 
                  mostRecentRecordedSaleID = assets[0].token_id
                }
                const price = assets[i].last_sale.total_price * "0.000000000000000001";
                const lastSale = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(assets[i].token_id + " - " + assets[i].asset_contract.name)
                    .setURL(assets[i].permalink)
                    .addFields(
                        { name: 'Price', value: price.toString().substring(0, 5) },
                        { name: 'Buyer', value: assets[i].last_sale.transaction.from_account.address }
                    )
                    .setImage(assets[i].image_url);
                test_channel.send({ embeds: [lastSale] })
            }
        }
        tryLogLastSales();
        // console.log(client.channels.cache)
    }

    else if (command === 'test2'){
      console.log(mostRecentRecordedSaleID)
    }


    else if (command === 'list') {
        msg.reply("- !floor : List floor price for DA collection \n- !claim <role> : Claim a role. (Bloodline or faction)")
    }

    else {
        msg.reply("Unknown command, to list all available commands type !list")
    }

    // if (command === 'floordiv4'){
    //   const test = await getDivBy4Floor()
    //   console.log(test)
    // }

});

server.all("/", (req, res) => {
    res.send("Bot is running!")
})
server.listen(3000, () => {
    console.log(`${new Date()}: server is ready.`)
})
client.login(process.env['TOKEN']);
