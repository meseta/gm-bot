/* eslint-disable no-unused-vars */
const Discord = require('discord.js');
const rules = require('../rules.js');
const giveAways = require('../utils/giveAwayLib.js');
const devModeExp = new RegExp(/([`]{3})!devmode([^```]*)([`]{3})/g);

let roleService = require('../services/role.service');
let guildService = require('../services/guild.service');
let channelService = require('../services/channel.service');

module.exports = function(msg, bot) {
  if (!msg.member) return false;

  // Only topherlicious (and TonyStr) can use this feature!
  if (msg.member.id !== '144913457429348352' && msg.member.id !== '227032791013916672') {
    return false;
  }

  if (devModeExp.test(msg.content)) {
    // Fetch the code block contents
    let code = msg.content.match(devModeExp);

    // Get just the code
    let rawCode = code[0].substr(11,code[0].length - 14);

    // Create helper functions
    // eslint-disable-next-line func-style
    let reply = function(str) {
      msg.channel.send(str);
    };

    // Execute code
    // eslint-disable-next-line no-eval
    eval(rawCode);

    return true;
  } else {
    return false;
  }
};
/* eslint-enable no-unused-vars */
