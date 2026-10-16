import { createTorvikI18n } from "../src/lib/i18n";
import { LANGUAGES } from "../src/lib/i18n/languages";
import { VOICE_REFERENCES } from "../src/lib/voice/reference";
import { writeFileSync } from "node:fs";
const reference = LANGUAGES.map(({ code, speech }) => {
  const instance = createTorvikI18n(code);
  return {
    language: code,
    speechLanguage: speech,
    realPlaybackValidated: false,
    humanPronunciationReviewed: false,
    phrases: VOICE_REFERENCES.map((item) => ({
      event: item.event,
      key: item.key,
      text: instance.t(item.key, "values" in item ? item.values : {}),
    })),
  };
});
writeFileSync("docs/i18n-audio-reference.json", JSON.stringify(reference, null, 2) + "\n");
