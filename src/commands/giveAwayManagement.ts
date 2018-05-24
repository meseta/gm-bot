import { Message } from 'discord.js';

// Project libs
import { deleteGiveaway, getGiveAways, createGiveaway, drawGiveawayWinner } from '../shared';

/**
 * Allows giveaway management from within Discord
 * @param msg 
 * @param args 
 */
module.exports = function(msg: Message, args: string[]) {
  if (args.length < 2) {
    sendGiveAwayList(msg);
  } else {
    switch (args[1]) {
      case '-q':
        quickCreate(msg, args[2], args[3]);
        break;
      case '-x':
        deleteGa(msg, args[2]);
        break;
      case '-d':
        drawWinner(msg, args[2]);
        break;
      default:
        sendGiveAwayList(msg);
        break;
    }
  }
}

/**
 * Draws a winner for a giveaway
 * @param msg 
 * @param name giveaway name
 */
function drawWinner(msg: Message, name: string) {
  let exists = giveAwayExists(name);

  if (exists) {
    let winners = drawGiveawayWinner(name, 1);
    if (winners) {
      msg.channel.send(`A winner has been drawn for the ${name} giveaway! Winner: <@${winners[winners.length - 1].userID}>`);
    } else {
      msg.channel.send('Something went wrong when trying to draw a winner... Does this giveaway have any participants to draw from?');
    }
  } else {
    msg.channel.send(`Could not find giveaway with the name "${name}".`);
  }
}

/**
 * Deletes a giveaway
 * @param msg 
 * @param name 
 */
function deleteGa(msg: Message, name: string) {
  let exists = giveAwayExists(name);

  if (exists) {
    deleteGiveaway(name);
    msg.channel.send(`Deleted giveaway "${name}".`);
  } else {
    msg.channel.send(`Could not find giveaway with the name "${name}".`);
  }
}

/**
 * Quickly creates a giveaway that starts immediately and ends in one year
 * @param msg 
 * @param name 
 */
function quickCreate(msg: Message, name: string, days) {
  if (!name) {
    msg.author.send('You need to supply a name dude. Something like: `!gaa -q myCoolGiveaway 2`');
  } else if (!days) {
    msg.author.send('You need to supply a length dude. Something like: `!gaa -q myCoolGiveaway 2`');    
  } else {
    let now: any = new Date();
    let later: any = new Date();
    later.setDate(now.getDate() + parseInt(days));

    // Create the giveaway
    let res = createGiveaway(name, now / 1000, later / 1000);

    if (res) {
      getGiveAways().some(giveAway => {
        if (giveAway.giveAway === name) {
          msg.channel.send(`Ayyyy success :thumbsup:\n${formatGiveawayStats(giveAway)}`);
          return true;
        }
      });
    } else {
      msg.channel.send('A giveaway with that name already exists.');
    }
  }
}

/**
 * Replies to a message with an organized list of current giveaways
 * @param msg 
 */
function sendGiveAwayList(msg: Message) {
  let currentGiveaways = getGiveAways();

  let giveAwayList = 'Current giveaways:\n\n';
  currentGiveaways.forEach(giveAway => {
    giveAwayList += formatGiveawayStats(giveAway);
  });

  msg.channel.send(giveAwayList);
}

/**
 * Determine if a giveaway exists
 * @param name Name of giveaway
 */
function giveAwayExists(name: string) {
  let exists = false;
  getGiveAways().some(giveAway => {
    if (giveAway.giveAway === name) {
      exists = true;
      return true;
    }
  });
  return exists;
}

/**
 * Formats a string with stats about a giveaway
 * @param giveAway 
 */
function formatGiveawayStats(giveAway: {
  giveAway: string;
  start: number;
  end: number;
  participants: any[];
  winners: any[];
}) {
  let stats = '';
  stats += '```\n';
  stats += `Name: ${giveAway.giveAway}\n`;
  stats += `Start: ${new Date(giveAway.start * 1000).toString()}\n`;
  stats += `End: ${new Date(giveAway.end * 1000).toString()}\n`;
  stats += `Number of participants: ${giveAway.participants.length}\n`;
  if (giveAway.winners.length) {
    stats += 'Winners: ';
    giveAway.winners.forEach(winner => {
      stats += `${winner.userName} `;
    });
    stats += '\n';
  }
  stats += '```\n';
  return stats;
}
