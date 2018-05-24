import { Message } from 'discord.js';

// Prevent errors when running things in puppeteer context
declare let SearchTitles;
declare let SearchFiles;

// Node libs
import vm = require('vm');
import http = require('http');
import concat = require('concat-stream');
import puppeteer = require('puppeteer');

// Services
import { jsonService } from '../shared/services/json.service';

// Docs data
import { gml } from '../shared';
const gms1 = jsonService.files['gms1-docs-urls'];

/**
 * Provide GMS2 doc URL
 * @param msg The Discord message asking for help
 * @param fn Function name to lookup
 */
function helpUrlGMS2(msg: Message, fn: string, image) {
  // Download super saucy secret file from YYG server
  http.get('http://docs2.yoyogames.com/files/searchdat.js', (res) => {
    // Read like a normal bot
    res.setEncoding('utf8');

    // Let's check the goods
    res.pipe(concat({ encoding: 'string' }, remoteSrc => {
      let found = false;

      // Execute in context to access the inner JS
      vm.runInThisContext(remoteSrc, 'remote_modules/searchdat.js');

      // Loop through newly available SearchTitles (from searchdat.js)
      for (let i = 0; i < SearchTitles.length; i++) {
        // If we find the function we're looking for
        if (SearchTitles[i] === fn) {
          // Send a screenshot if requested
          if (image) {
            sendScreenshot(
              `Here's the GMS2 documentation for \`${fn}\``,
              `http://docs2.yoyogames.com/${SearchFiles[i]}`,
              msg
            );
            return;
          }
          
          // Provide it
          msg.channel.send(`Here's the GMS2 documentation for \`${fn}\`, ${msg.author}`).catch(() => {});
          msg.channel.send(encodeURI(`http://docs2.yoyogames.com/${SearchFiles[i]}`)).catch(() => {});

          // Indiciate we found it
          found = true;
          break;
        }
      }

      // If we haven't found jack...
      if (!found) {
        // Sorry pal
        msg.author.send(`\`${fn}\` was not a recognized GMS2 function. Type \`!help\` for help with commands.`);
      }
    }));
  });
}

/**
 * Provide GMS1 doc URL
 * @param msg The Discord message asking for help
 * @param fn Function name to lookup
 */
function helpUrlGMS1(msg: Message, fn: string, image) {
  let found = false;

  // Loop through valid titles
  for (let i = 0; i < gms1.titles.length; i++) {
    // If we match up with a function
    if (gms1.titles[i] === fn) {
      // Send a screenshot if requested
      if (image) {
        sendScreenshot(
          `Here's the GMS1 documentation for \`${fn}\``,
          `http://docs.yoyogames.com/${gms1.files[i]}`,
          msg
        );
        return;
      }
      
      // Get name of whoever sent the message
      let name = (msg.member && msg.member.nickname) || msg.author.username;

      // Put together a URL and serve it on a silver platter
      msg.channel.send(`Here's the GMS1 documentation for \`${fn}\`, ${name}`).catch(() => {});
      msg.channel.send(encodeURI(`http://docs.yoyogames.com/${gms1.files[i]}`)).catch(() => {});

      // We struck gold, ma!
      found = true;
      break;
    }
  }

  // No gold to be found
  if (!found) {
    // Tough luck
    msg.author.send(`\`${fn}\` was not a recognized GMS2 function. Type \`!help\` for help with commands.`);
  }
}

/**
 * Takes a screenshot of a website and sends it to the discord chat
 * @param messageText Message to send with screenshot
 * @param URL Website to take a screenshot of
 * @param msg Discord message
 */
function sendScreenshot(messageText: string, URL: string, msg: Message) {
  msg.channel.send('Loading documentation...').then(async (message: Message) => {
    // Launch chrome
    let browser = await puppeteer.launch();
  
    // Create a new page
    const page = await browser.newPage();
  
    // Navigate to the URL
    await page.goto(URL);
  
    // Remove the top useless elements of the docs page
    await page.evaluate(() => new Promise(res => {
      document.querySelector('table').remove();
      document.querySelector('br').remove();
      res();
    }));
  
    // Set our viewport to be 1280 wide
    await page.setViewport({
      width: 1280,
      height: 1
    });
  
    // Take a screenshot of the full page
    let image = await page.screenshot({
      fullPage: true
    });
  
    // Close the browser
    await browser.close();
  
    // Send the message
    msg.channel.send(messageText, <any>{
      file: image,
      name: 'capture.png'
    }).then(() => { message.delete(); }).catch(() => {});
  });
}

/**
 * Commence documentation fetching!
 * @param msg Discord message
 * @param args Command arguments
 */
function run(msg: Message, args: string[]) {
  // Default to GMS2 documentation
  let version = 'GMS2';
  let image = false;

  if (args.length === 1) {
    // Throw on unsupplied function
    msg.author.send('You did not include a function name. Type `!help` for help with commands.');
    return;
  } else if (args.length > 2) {
    let v1 = args.indexOf('gms1');
    let v2 = args.indexOf('gms2');

    if (v1 !== -1) {
      version = args[v1].toUpperCase();
    } else if (v2 !== -1) {
      version = args[v2].toUpperCase();
    }

    if (args.indexOf('-i') !== -1) {
      image = true;
    }
  }

  // Switch on version
  switch (version) {
    case 'GMS1':
      // Determine if the provided function is a valid GMS1 function
      if (gml.gms1(args[1])) {
        // If so, provide the helps
        helpUrlGMS1(msg, args[1], image);
      } else {
        // Otherwise, provide the nopes
        msg.author.send(`\`${args[1]}\` was not a recognized GMS1 function. Type \`!help\` for help with commands.`);
      }
      break;
  case 'GMS2':
    // Determine if the provided function is a valid GMS2 function
    if (gml.gms2(args[1])) {
      // If so, give 'em the goods
      helpUrlGMS2(msg, args[1], image);
    } else {
      // Otherwise, kick 'em to the curb
      msg.author.send(`\`${args[1]}\` was not a recognized GMS2 function. Type \`!help\` for help with commands.`);
    }
    break;
  default:
    // What were they THINKING (invalid GMS version)
    msg.author.send(`\`${version}\` was not a valid option. Type \`!help\` for help with commands.`);
    break;
  }
}

module.exports = run;
