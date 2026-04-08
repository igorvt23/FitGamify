import { useMemo } from "react";
import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import { translations } from "./translations";
import { useAppContext } from "../state/AppContext";

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = "pt-BR";

export function useI18n() {
  const { language } = useAppContext();
  const locale = language ?? getLocales()[0]?.languageTag ?? "pt-BR";

  return useMemo(() => {
    i18n.locale = locale;
    return {
      t: (key: string, options?: Record<string, unknown>) => i18n.t(key, options)
    };
  }, [locale]);
}
