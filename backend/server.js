import express from "express";
import { TwitterApi } from "twitter-api-v2";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import schedule from "node-schedule";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());


// Twitter API authentication
const twitterClient = new TwitterApi({
  appKey: process.env.API_KEY,
  appSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET,
});


// OpenAI API setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Function to fetch trending Twitter hashtags
async function getTrendingHashtags() {
  try {
    const trends = await twitterClient.v1.trendsByPlace(1); // WOEID 1 = Worldwide
    const hashtags = trends[0].trends
      .filter((trend) => trend.name.startsWith("#"))
      .slice(0, 3) // Get top 3 hashtags
      .map((trend) => trend.name)
      .join(" ");
    return hashtags || "#Tech #AI";
  } catch (error) {
    console.error("❌ Error fetching hashtags:", error);
    return "#Tech #AI";
  }
}


// Function to generate AI-based tweet
async function generateTweet(topic = "technology and AI") {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate a short, engaging tweet about ${topic}. Keep it under 280 characters.`,
        },
      ],
      max_tokens: 50,
    });

    const emojis = ["🚀", "🔥", "✨", "💡", "🤖", "📢"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const timestamp = new Date().toISOString().split("T")[0]; // Adds today's date

    const hashtags = await getTrendingHashtags();
    return `${response.choices[0].message.content.trim()} ${randomEmoji} (${timestamp}) ${hashtags}`;
  } catch (error) {
    console.error("❌ Error generating tweet:", error);
    return "Test #Technology #AI";
  }
}


// Function to generate AI image (DALL·E)
async function generateImage(topic) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-2"||"dall-e-3",
      prompt: `An artistic, eye-catching image about ${topic}`,
      n: 1,
      size: "1024x1024",
    });
    return response.data[0].url;
  } catch (error) {
    console.error("❌ Error generating image:", error);
    return null;
  }
}


// Function to post a tweet
async function postTweet(tweet) {
  try {
    await twitterClient.v2.tweet(tweet);
    console.log("✅ Tweet posted:", tweet);
  } catch (error) {
    console.error("❌ Error posting tweet:", error);
  }
}


// Function to post a tweet with an image
async function postTweetWithImage(topic) {
  const tweet = await generateTweet(topic);
  const imageUrl = await generateImage(topic);

  try {
    if (imageUrl) {
      const mediaId = await twitterClient.v1.uploadMedia(imageUrl);
      await twitterClient.v2.tweet({
        text: tweet,
        media: { media_ids: [mediaId] },
      });
      console.log("✅ Tweet posted with image:", tweet);
    } else {
      await twitterClient.v2.tweet(tweet);
      console.log("✅ Tweet posted without image:", tweet);
    }
  } catch (error) {
    console.error("❌ Error posting tweet with image:", error);
  }
}


// API Routes
app.post("/tweet/ai", async (req, res) => {
  const { topic } = req.body;
  const tweet = await generateTweet(topic);
 
  await postTweet(tweet);
  res.json({ success: true, message: `AI tweet posted --> "${tweet}"` });
});

app.post("/tweet/ai-image", async (req, res) => {
  const { topic } = req.body;
  await postTweetWithImage(topic);
  res.json({ success: true, message: `Tweet with AI-generated image posted --> "${topic}"` });
});


// Auto-schedule AI tweets every 12 hours and alternate between text-only and image
let lastRun = 0;
schedule.scheduleJob("0 */12 * * *", async () => {
  const currentTime = new Date().getTime();
  if (lastRun === 0 || currentTime - lastRun >= 12 * 60 * 60 * 1000) {
    console.log("⏳ Generating AI tweet... (Text Only)");
    const tweet = await generateTweet("technology and AI");
    await postTweet(tweet);
    lastRun = currentTime;
  }
});
schedule.scheduleJob("0 */24 * * *", async () => {
  const currentTime = new Date().getTime();
  if (lastRun === 0 || currentTime - lastRun >= 12 * 60 * 60 * 1000) {
    console.log("⏳ Generating AI tweet with image...");
    await postTweetWithImage("technology and AI");
    lastRun = currentTime;
  }
});


app.listen(5000, () => console.log("✅ Server running on port 5000"));
