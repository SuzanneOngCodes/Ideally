import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LanguageCode, APAC_LANGUAGES } from "../types/i18n";

export const LanguageSelector: React.FC = () => {
	const { currentLanguage, setLanguage, activeLanguageInfo, translationProvider } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (code: LanguageCode) => {
		setLanguage(code);
		setIsOpen(false);
	};

	return (
		<div className='relative inline-block text-left' ref={dropdownRef}>
			<button onClick={() => setIsOpen(!isOpen)} className='px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900' title='Select language' aria-expanded={isOpen}>
				<span className='text-sm leading-none'>{activeLanguageInfo.flag}</span>
				<span className='font-medium text-slate-700 hidden sm:inline'>{activeLanguageInfo.nativeName}</span>
				<ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
			</button>

			{isOpen && (
				<div className='fixed left-1/2 -translate-x-1/2 top-auto mt-1.5 right-0 mt-1.5 w-[calc(100vw-1rem)] max-w-80 sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex flex-col max-h-[calc(100dvh-5rem)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden'>
					{/* Header */}
					<div className='px-3.5 py-2.5 border-b border-slate-100 shrink-0'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-1.5 min-w-0'>
								<Languages className='w-4 h-4 text-indigo-600 shrink-0' />

								<span className='text-xs font-bold text-slate-900'>Languages</span>
							</div>

							<span className='text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0'>Cloud Translation</span>
						</div>

						<p className='text-[11px] text-slate-500 mt-1 leading-relaxed'>High-fidelity scholarly localization for Japan & APAC Regions</p>
					</div>

					{/* Language Options List */}
					<div className='py-1 flex-1 min-h-0 overflow-y-auto overscroll-contain'>
						{APAC_LANGUAGES.map((lang) => {
							const isSelected = lang.code === currentLanguage;

							return (
								<button key={lang.code} type='button' onClick={() => handleSelect(lang.code)} aria-pressed={isSelected} className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-3 transition-colors ${isSelected ? "bg-indigo-50/80 text-indigo-950 font-semibold" : "hover:bg-slate-50 text-slate-700"}`}>
									{/* Language Name and Flag */}
									<div className='flex items-center gap-2.5 min-w-0 flex-1'>
										<span className='text-base leading-none shrink-0'>{lang.flag}</span>

										<div className='min-w-0 flex-1'>
											<div className='flex items-center gap-1.5'>
												<span className='text-slate-900 font-medium break-words'>{lang.nativeName}</span>
											</div>

											<div className='text-[10px] text-slate-400 break-words mt-0.5'>
												{lang.name} • {lang.country}
											</div>
										</div>
									</div>

									{/* Selected Indicator */}
									{isSelected && <Check className='w-4 h-4 text-indigo-600 shrink-0' aria-hidden='true' />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
