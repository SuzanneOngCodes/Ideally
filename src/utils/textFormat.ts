// Function to handle mathematical text and titles
export function renderScholarlyText(text: string | null | undefined): string {
	if (!text) return "";

	// 1. Map mathematical symbol structures into beautiful native Unicode
	let processed = text
		.replace(/\\to/g, "→")
		.replace(/\\rightarrow/g, "→")
		.replace(/\\mu/g, "μ")
		.replace(/\\pm/g, "±")
		.replace(/\\alpha/g, "α")
		.replace(/\\beta/g, "β");

	// 2. Safely translate basic numeric superscripts (e.g., ^0 -> ⁰, ^+ -> ⁺, ^- -> ⁻)
	const superMap: Record<string, string> = {
		"0": "⁰",
		"1": "¹",
		"2": "²",
		"3": "³",
		"4": "⁴",
		"5": "⁵",
		"6": "⁶",
		"7": "⁷",
		"8": "⁸",
		"9": "⁹",
		"+": "⁺",
		"-": "⁻",
		"=": "⁼",
		"(": "⁽",
		")": "⁾",
		n: "ⁿ",
	};
	processed = processed.replace(/\^([0-9+\-n()])/g, (_, match) => superMap[match] || match);

	// 3. Safely translate basic subscripts (e.g., _s -> ₛ, _2 -> ₂, _x -> ₓ)
	const subMap: Record<string, string> = {
		"0": "₀",
		"1": "₁",
		"2": "₂",
		"3": "₃",
		"4": "₄",
		"5": "₅",
		"6": "₆",
		"7": "₇",
		"8": "₈",
		"9": "₉",
		"+": "₊",
		"-": "₋",
		"(": "₍",
		")": "₎",
		a: "ₐ",
		e: "ₑ",
		h: "ₕ",
		i: "ᵢ",
		j: "ⱼ",
		k: "ₖ",
		l: "ₗ",
		m: "ₘ",
		n: "ₙ",
		o: "ₒ",
		p: "ₚ",
		r: "ᵣ",
		s: "ₛ",
		t: "ₜ",
		u: "ᵤ",
		v: "ᵥ",
		x: "ₓ",
	};
	processed = processed.replace(/_([0-9+\-a-vx()])/g, (_, match) => subMap[match] || match);

	// 4. Strip out remaining inline math boundary markers ($) completely
	processed = processed.replace(/\$/g, "");

	// 5. Clean up any leftover curly bracket structures if LaTeX styles were complex
	processed = processed.replace(/[{}]/g, "");

	return processed;
}
