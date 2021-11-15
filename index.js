const express = require('express');

const server = express()

server.all("/", (req, res) => {
  res.send("Bot is running!")
})

function keepAlive() {
  server.listen(3000, () => {
    console.log("server is ready.")
  })
}

const { Client, Intents } = require("discord.js")
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("messageCreate", msg => {
  let splitMessage = msg.content.split(" ");
  let prefix = splitMessage[0];
  let roleName = splitMessage[1];

  if(roleName === "admin"){
    msg.reply("You don't have permissions for that.")
  } else {
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
})

keepAlive();
client.login(process.env['TOKEN']);
