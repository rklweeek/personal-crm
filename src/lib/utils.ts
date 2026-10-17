import { createCn } from "cn/config"

// Custom theme tokens from globals.css. Without them `cn` takes e.g.
// `text-button` for a text color and drops it next to `text-white`.
export const cn = createCn({
  extend: {
    theme: {
      text: ["title", "name", "logo", "nav", "button", "card-title", "note", "label", "footer"],
      tracking: ["caps", "label", "mono"],
      radius: ["card", "inset"],
      shadow: ["card"],
    },
  },
})
