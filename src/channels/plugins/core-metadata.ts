import {
  BlueBubblesConfigSchema,
  DiscordConfigSchema,
  GoogleChatConfigSchema,
  IMessageConfigSchema,
  MSTeamsConfigSchema,
  SignalConfigSchema,
  SlackConfigSchema,
  TelegramConfigSchema,
} from "../../config/zod-schema.providers-core.js";
import { WhatsAppConfigSchema } from "../../config/zod-schema.providers-whatsapp.js";
import { getChatChannelMeta } from "../registry.js";
import { buildChannelConfigSchema } from "./config-schema.js";
import type { ChannelPlugin } from "./types.plugin.js";

export function listCoreChannelMetadata(): Partial<ChannelPlugin>[] {
  const result: Partial<ChannelPlugin>[] = [
    {
      id: "telegram",
      meta: getChatChannelMeta("telegram"),
      configSchema: buildChannelConfigSchema(TelegramConfigSchema),
    },
    {
      id: "whatsapp",
      meta: getChatChannelMeta("whatsapp"),
      configSchema: buildChannelConfigSchema(WhatsAppConfigSchema),
    },
    {
      id: "discord",
      meta: getChatChannelMeta("discord"),
      configSchema: buildChannelConfigSchema(DiscordConfigSchema),
    },
    {
      id: "googlechat",
      meta: getChatChannelMeta("googlechat"),
      configSchema: buildChannelConfigSchema(GoogleChatConfigSchema),
    },
    {
      id: "slack",
      meta: getChatChannelMeta("slack"),
      configSchema: buildChannelConfigSchema(SlackConfigSchema),
    },
    {
      id: "signal",
      meta: getChatChannelMeta("signal"),
      configSchema: buildChannelConfigSchema(SignalConfigSchema),
    },
    {
      id: "imessage",
      meta: getChatChannelMeta("imessage"),
      configSchema: buildChannelConfigSchema(IMessageConfigSchema),
    },
  ];

  // Also include these if they have schemas but aren't in the main order (for future proofing)
  try {
    result.push({
      id: "bluebubbles",
      meta: { id: "bluebubbles", label: "BlueBubbles" } as any,
      configSchema: buildChannelConfigSchema(BlueBubblesConfigSchema),
    });
    result.push({
      id: "msteams",
      meta: { id: "msteams", label: "MS Teams" } as any,
      configSchema: buildChannelConfigSchema(MSTeamsConfigSchema),
    });
  } catch (e) {
    // Ignore if meta is missing
  }

  return result;
}
