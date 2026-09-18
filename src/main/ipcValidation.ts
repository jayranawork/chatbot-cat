import { z } from "zod";

export const appSettingsPatchSchema = z
  .object({
    alwaysOnTop: z.boolean().optional(),
    focusMode: z.boolean().optional(),
    launchAtStartup: z.boolean().optional(),
    paused: z.boolean().optional(),
  })
  .strict();

export type ValidatedAppSettingsPatch = z.infer<typeof appSettingsPatchSchema>;

export const aiRequestPayloadSchema = z
  .object({
    requestId: z.string().min(1).max(100),
    kind: z.literal("chat"),
    message: z.string().trim().min(1).max(4000),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().max(4000),
        }),
      )
      .max(20)
      .optional(),
  })
  .strict();

export const aiRequestIdSchema = z.string().min(1).max(100);
export const memoryUserNameSchema = z.string().trim().min(1).max(80);
