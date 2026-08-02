import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { languageAlternates, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get("x-lovtokens-locale");
  return value === "zh" ? "zh" : "en";
}

export async function getRequestedPath() {
  return (await headers()).get("x-lovtokens-path") || "/";
}

export async function localizedMetadata({
  path,
  title,
  zhTitle,
  description,
  zhDescription,
  robots,
}: {
  path: string;
  title: string;
  zhTitle: string;
  description?: string;
  zhDescription?: string;
  robots?: Metadata["robots"];
}): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: locale === "zh" ? zhTitle : title,
    description: locale === "zh" ? zhDescription ?? description : description,
    alternates: languageAlternates(path, locale),
    robots,
  };
}
