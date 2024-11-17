import puppeteer from "puppeteer";
import { Bot } from "grammy";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const bot = new Bot(BOT_TOKEN);

async function getCitiesFromWebsite(): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://geography.fandom.com/ru/wiki/Список_городов_Украины",
    {
      waitUntil: "domcontentloaded",
    }
  );

  const cities = await page.$$eval(".mw-parser-output tbody tr", (rows) => {
    return rows
      .map((row) => {
        const cityNameCell = row.querySelector("td:first-child");
        if (cityNameCell) {
          return cityNameCell.innerText.trim();
        }
        return null;
      })
      .filter(Boolean);
  });

  await browser.close();
  return cities;
}

bot.command("parse", async (ctx) => {
  try {
    const cities = await getCitiesFromWebsite();
    const citiesList = cities.join("\n");
    await ctx.reply(`List of cities in Ukraine: \n\n${citiesList}`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Parsing error: ", error);
    await ctx.reply("There was an error while getting the list of cities.");
  }
});

bot
  .start()
  .catch((error) => console.error("Error when launching the bot:", error));
