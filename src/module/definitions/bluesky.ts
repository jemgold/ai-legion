import { defineModule } from "../define-module";
import { messageBuilder } from "../../message";

import { BskyAgent, RichText } from "@atproto/api";

export default defineModule({
  name: "bluesky",
}).with({
  actions: {
    post: {
      description: "Post to bluesky",
      parameters: {
        text: {
          description: "The text to post",
        },
      },
      async execute({
        parameters: { text },
        context: { agentId },
        sendMessage,
      }) {
        try {
          await postMessage(text);
          sendMessage(messageBuilder.ok(agentId, `Posted to bluesky.`));
        } catch (err) {
          sendMessage(messageBuilder.error(agentId, JSON.stringify(err)));
        }
      },
    },
  },
});

export async function postMessage(text: string) {
  const agent = new BskyAgent({
    service: "https://bsky.social",
  });

  await agent.login({
    identifier: process.env.BSKY_USERNAME!,
    password: process.env.BSKY_PASSWORD!,
  });

  const rt = new RichText({
    text,
  });
  await rt.detectFacets(agent); // automatically detects mentions and links

  const postRecord = {
    $type: "app.bsky.feed.post",
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  };

  await agent.post(postRecord);
}
