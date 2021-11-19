const express = require('express');
const axios = require('axios');

const server = express()

server.all("/", (req, res) => {
  res.send("Bot is running!")
})

function keepAlive() {
  server.listen(3000, () => {
    console.log("server is ready.")
  })
}

const { Client, Intents, MessageEmbed } = require("discord.js")
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on("ready", client => {
  console.log(`Logged in as ${client.user.tag}!`);

  let channel = client.channels.cache.get("910628753057648650");

  const options = {
  method: 'GET',
  url: 'https://api.opensea.io/api/v1/assets?asset_contract_address=0xc631164b6cb1340b5123c9162f8558c866de1926&order_by=sale_date&order_direction=desc&offset=0&limit=1',
  };

  // Check OS for most recent sale every minute
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
    if(lastMessage.embeds[0].title.split(" ")[0] === sale.token_id){
      return
    } else {
      channel.send({ embeds: [lastSale] });
    }
    }).catch(console.error);

    }).catch(function (error) {
    console.error(error);
    });
  }, 60000);

});


client.on("messageCreate", async msg => {
  // split claim message to get prefix and bloodline
  let splitMessage = msg.content.split(" ");
  let prefix = splitMessage[0];
  if(splitMessage[1]){
    let roleNameToLowerCase = splitMessage[1].toLowerCase();
    let roleName = roleNameToLowerCase.charAt(0).toUpperCase() + roleNameToLowerCase.slice(1);  
  
  // check if trying to claim admin and restrict
  if(roleName === "admin"){
    msg.reply("You don't have permissions for that.")
  } else {
      // if prefix is !claim check if they already have role else add bloodline role
      if(prefix === "!claim") {
        let role = msg.guild.roles.cache.find(r => r.name === roleName);
        let member = msg.member;
        if(role){
          if(member.roles.cache.has(role.id)) {
            msg.reply("This role has already been claimed.")
          } else {
            member.roles.add(role).catch(console.error);
            msg.reply('Role Added!')
          }
        }
        else {
        msg.reply("Role doesn't exist.")
        }
      }
    }
  }

  // Check OS api for current floor price
  if(msg.content === "!floor") {
    let floorPrice = await axios.get('https://api.opensea.io/collection/divineanarchy')
    .then(response => response.data)
    .then(data => data.collection.stats.floor_price)
    .then(floorPrice => { return JSON.stringify(floorPrice)});

    if(floorPrice){
      msg.reply(floorPrice)
    }
  }
});


keepAlive();
client.login(process.env['TOKEN']);
