export type LanguageCode = "en" | "ja" | "zh-CN" | "zh-TW" | "ko" | "id" | "vi" | "th";

export interface ApacLanguage {
	code: LanguageCode;
	name: string;
	nativeName: string;
	flag: string;
	region: "Japan" | "East Asia" | "Southeast Asia" | "Global";
	script: string;
}

export const APAC_LANGUAGES: ApacLanguage[] = [
	{
		code: "en",
		name: "English",
		nativeName: "English",
		flag: "🌐",
		region: "Global",
		script: "Latin",
	},
	{
		code: "ja",
		name: "Japanese",
		nativeName: "日本語",
		flag: "🇯🇵",
		region: "Japan",
		script: "Kanji / Kana",
	},
	{
		code: "zh-CN",
		name: "Simplified Chinese",
		nativeName: "简体中文",
		flag: "🇨🇳",
		region: "East Asia",
		script: "Simplified Hanzi",
	},
	{
		code: "zh-TW",
		name: "Traditional Chinese",
		nativeName: "繁體中文",
		flag: "🇹🇼",
		region: "East Asia",
		script: "Traditional Hanzi",
	},
	{
		code: "ko",
		name: "Korean",
		nativeName: "한국어",
		flag: "🇰🇷",
		region: "East Asia",
		script: "Hangul",
	},
	{
		code: "id",
		name: "Indonesian",
		nativeName: "Bahasa Indonesia",
		flag: "🇮🇩",
		region: "Southeast Asia",
		script: "Latin",
	},
	{
		code: "vi",
		name: "Vietnamese",
		nativeName: "Tiếng Việt",
		flag: "🇻🇳",
		region: "Southeast Asia",
		script: "Quốc Ngữ",
	},
	{
		code: "th",
		name: "Thai",
		nativeName: "ภาษาไทย",
		flag: "🇹🇭",
		region: "Southeast Asia",
		script: "Thai Script",
	},
];
