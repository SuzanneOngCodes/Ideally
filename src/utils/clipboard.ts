/**
 * Copies text to the user's clipboard reliably across desktop, mobile,
 * and sandboxed iframe environments (such as preview frames and web embeds).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (!text) return false;

	// 1. Try modern asynchronous Clipboard API first
	if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			console.warn("navigator.clipboard.writeText failed or was blocked by iframe permissions, attempting execCommand fallback", err);
		}
	}

	// 2. Fallback using invisible textarea and document.execCommand('copy')
	if (typeof document !== "undefined") {
		try {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			// Prevent scrolling or zooming in mobile browsers
			textArea.style.position = "fixed";
			textArea.style.top = "0";
			textArea.style.left = "-9999px";
			textArea.style.width = "2em";
			textArea.style.height = "2em";
			textArea.style.padding = "0";
			textArea.style.border = "none";
			textArea.style.outline = "none";
			textArea.style.boxShadow = "none";
			textArea.style.background = "transparent";
			textArea.style.opacity = "0";
			textArea.setAttribute("readonly", "");
			document.body.appendChild(textArea);

			textArea.focus({ preventScroll: true });
			textArea.select();
			textArea.setSelectionRange(0, text.length);

			const successful = document.execCommand("copy");
			document.body.removeChild(textArea);
			if (successful) {
				return true;
			}
		} catch (fallbackErr) {
			console.error("execCommand copy fallback failed", fallbackErr);
		}
	}

	return false;
}
