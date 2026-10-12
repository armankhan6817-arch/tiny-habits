import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

export async function POST(req) {
  try {
    const { goal } = await req.json();
    if (!goal || !goal.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing goal text in the request." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const prompt = `Write Three tiny Habits for ${goal} and return only exact 3 habits text without any additional commentary or explanation. `;
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return new Response(
      JSON.stringify({
        habits: response.content[0].text
          .split("\n")
          .filter((line) => line.trim() !== ""),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to get data from anthropic." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
