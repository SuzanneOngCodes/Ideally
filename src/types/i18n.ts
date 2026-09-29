export type LanguageCode = "en" | "ja" | "zh-CN" | "zh-TW" | "ko" | "id" | "vi" | "th";

export interface ApacLanguage {
	code: LanguageCode;
	name: string;
	nativeName: string;
	flag: string;
	region: "Japan" | "East Asia" | "Southeast Asia" | "Global";
	country: string;
	script: string;
}

export const APAC_LANGUAGES: ApacLanguage[] = [
	{
		code: "en",
		name: "English",
		nativeName: "English",
		flag: "🌐",
		region: "Global",
		country: "International",
		script: "Latin",
	},
	{
		code: "ja",
		name: "Japanese",
		nativeName: "日本語",
		flag: "🇯🇵",
		region: "Japan",
		country: "Japan (日本)",
		script: "Kanji / Kana",
	},
	{
		code: "zh-CN",
		name: "Simplified Chinese",
		nativeName: "简体中文",
		flag: "🇨🇳",
		region: "East Asia",
		country: "China / Singapore (中国 / 新加坡)",
		script: "Simplified Hanzi",
	},
	{
		code: "zh-TW",
		name: "Traditional Chinese",
		nativeName: "繁體中文",
		flag: "🇹🇼",
		region: "East Asia",
		country: "Taiwan / Hong Kong (台灣 / 香港)",
		script: "Traditional Hanzi",
	},
	{
		code: "ko",
		name: "Korean",
		nativeName: "한국어",
		flag: "🇰🇷",
		region: "East Asia",
		country: "South Korea (대한민국)",
		script: "Hangul",
	},
	{
		code: "id",
		name: "Indonesian",
		nativeName: "Bahasa Indonesia",
		flag: "🇮🇩",
		region: "Southeast Asia",
		country: "Indonesia",
		script: "Latin",
	},
	{
		code: "vi",
		name: "Vietnamese",
		nativeName: "Tiếng Việt",
		flag: "🇻🇳",
		region: "Southeast Asia",
		country: "Vietnam (Việt Nam)",
		script: "Quốc Ngữ",
	},
	{
		code: "th",
		name: "Thai",
		nativeName: "ภาษาไทย",
		flag: "🇹🇭",
		region: "Southeast Asia",
		country: "Thailand (ประเทศไทย)",
		script: "Thai Script",
	},
];
