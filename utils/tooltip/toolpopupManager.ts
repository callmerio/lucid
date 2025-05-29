/**
 * ToolpopupManager - Handles the display of detailed word information.
 */

// Define a type for the detailed word data, based on dictionary.json structure
export interface WordDefinition {
    definition: string;
    chinese: string;
    chinese_short?: string;
}

export interface WordExplain {
    pos: string; // Part of Speech (e.g., "verb", "noun")
    definitions: WordDefinition[];
}

export interface WordPhonetic {
    us?: string;
    uk?: string;
    // Potentially other regions
}

export interface WordFormat {
    name: string;
    form: string;
}

export interface DetailedWordData {
    word: string;
    explain: WordExplain[];
    wordFormats?: WordFormat[];
    phonetic?: WordPhonetic;
    // Add other fields from dictionary.json as needed, e.g., relationships, metadata
}

export class ToolpopupManager {
    private static instance: ToolpopupManager;
    private currentToolpopup: HTMLElement | null = null;

    private constructor() { }

    public static getInstance(): ToolpopupManager {
        if (!ToolpopupManager.instance) {
            ToolpopupManager.instance = new ToolpopupManager();
        }
        return ToolpopupManager.instance;
    }

    /**
     * Simulates fetching detailed word data.
     * In a real application, this would involve an API call.
     */
    private async getWordDetailedInfo(word: string): Promise<DetailedWordData | null> {
        console.log(`[ToolpopupManager] Fetching detailed info for: ${word}`);

        if (word.toLowerCase() === 'escalade') {
            return {
                word: "escalade",
                phonetic: {
                    us: "ˌɛskəˈleɪd", // Slashes for display are handled in createToolpopupElement
                    uk: "ˈɛskəleɪd"
                },
                explain: [
                    {
                        pos: "n.",
                        definitions: [
                            {
                                definition: "An act of scaling a wall or rampart.",
                                chinese: "攀登；梯攻",
                                chinese_short: "攀登"
                            }
                        ]
                    },
                    {
                        pos: "v.",
                        definitions: [
                            {
                                definition: "To climb or scale, especially a wall or fortification.",
                                chinese: "攀登；梯攻",
                                chinese_short: "攀登"
                            }
                        ]
                    }
                ],
                wordFormats: [
                    { "name": "原型", "form": "escalade" }
                ]
                // wordForms from the new JSON could be added here if DetailedWordData is extended
            };
        }

        // Mock data based on dictionary.json structure for "did"
        if (word.toLowerCase() === 'did') {
            return {
                word: "did",
                phonetic: {
                    us: "dɪd",
                    uk: "dɪd"
                },
                explain: [
                    {
                        pos: "verb",
                        definitions: [
                            {
                                definition: "(past tense of do) performed an action, activity, or task.",
                                chinese: "（do的过去式）做；从事。",
                                chinese_short: "做（过去式）"
                            },
                            {
                                definition: "used as an auxiliary verb to form questions or negative statements in the past tense.",
                                chinese: "（用于构成疑问句或否定句）助动词过去式。",
                                chinese_short: "助动词（过去）"
                            }
                        ]
                    },
                    {
                        pos: "auxiliary verb",
                        definitions: [
                            {
                                definition: "used to form the past tense of negative statements, questions, and emphatic statements.",
                                chinese: "用于构成疑问句、否定句或强调句的过去式。",
                                chinese_short: "（助动词）"
                            }
                        ]
                    }
                ],
                wordFormats: [
                    { "name": "过去式", "form": "did" },
                    { "name": "过去式", "form": "did" },
                    { "name": "过去式", "form": "did" },
                    { "name": "过去式", "form": "did" },
                    { "name": "过去式", "form": "did" }
                ]
            };
        }
        // Fallback for other words (e.g. "Project" if you still want to test it)
        if (word.toLowerCase() === 'project') {
            return {
                word: "Project",
                phonetic: {
                    us: "/'pra:dʒekt/",
                },
                explain: [
                    {
                        pos: "n.",
                        definitions: [
                            { definition: "An individual or collaborative enterprise that is carefully planned to achieve a particular aim.", chinese: "工程；方案；计划" }
                        ]
                    },
                    {
                        pos: "v.",
                        definitions: [
                            { definition: "Estimate or forecast (something) on the basis of present trends or data.", chinese: "计划；规划；投影" }
                        ]
                    },
                    {
                        pos: "web.",
                        definitions: [
                            { definition: "A specific task or assignment, especially in academic or professional contexts.", chinese: "专案；课题；" }
                        ]
                    },
                    {
                        pos: "n.",
                        definitions: [
                            { definition: "A project, plan, scheme, or proposal (multi-meaning, translated differently based on context)", chinese: "项目, 计划, 工程, 方案 (多义, 根据上下文不同译为不同意思)" }
                        ]
                    }
                ]
            };
        }
        return {
            word: word,
            explain: [
                {
                    pos: "unknown",
                    definitions: [
                        { definition: "Detailed information not available for this word yet.", chinese: "暂无详细释义" }
                    ]
                }
            ],
            phonetic: { us: "N/A" }
        };
    }

    /**
     * Creates the HTML element for the toolpopup.
     */
    private createToolpopupElement(wordDetails: DetailedWordData): HTMLElement {
        const popup = document.createElement('div');
        popup.className = 'lucid-toolpopup-container'; // Use styles from toolpopup.html

        let phoneticHTML = '';
        if (wordDetails.phonetic?.us) {
            phoneticHTML = `
                <span class="lucid-toolpopup-phonetic-region">US</span>
                <span class="lucid-toolpopup-phonetic-text">/${wordDetails.phonetic.us}/</span>
            `;
        }
        if (wordDetails.phonetic?.uk && wordDetails.phonetic.us !== wordDetails.phonetic.uk) {
            phoneticHTML += ` <span class="lucid-toolpopup-phonetic-region">UK</span>
                <span class="lucid-toolpopup-phonetic-text">/${wordDetails.phonetic.uk}/</span>
                `;
        }
        if (phoneticHTML) {
            phoneticHTML += ` <svg class="lucid-toolpopup-speaker-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
        }

        const definitionsHTML = wordDetails.explain.map((group, index) => {
            // Determine POS class for styling, matching toolpopup.html
            let posClass = 'lucid-toolpopup-pos';
            const lowerPos = group.pos.toLowerCase();

            if (lowerPos.startsWith('n')) {
                // Special case for the 4th item (index 3) as per image styling for 'Project'
                if (wordDetails.word.toLowerCase() === 'project' && index === 3) {
                    posClass += ' pos-n-dynamic';
                } else {
                    posClass += ' pos-n';
                }
            } else if (lowerPos.startsWith('v') && !lowerPos.includes('auxiliary')) {
                posClass += ' pos-v';
            } else if (lowerPos.startsWith('web')) {
                posClass += ' pos-web';
            } else if (lowerPos === 'verb') {
                posClass += ' pos-verb';
            } else if (lowerPos === 'auxiliary verb') {
                posClass += ' pos-auxiliary-verb';
            }

            const defs = group.definitions.map(def => {
                const defText = `<span class="lucid-toolpopup-definition-text-chinese">${def.chinese_short || def.chinese}<span class="lucid-toolpopup-definition-text-english-tooltip">${def.definition}</span></span>`;
                // Optionally, include the English definition if needed, or the short form
                // defText += `<span class="lucid-toolpopup-definition-text-english">${def.definition}</span>`;
                return defText;
            }).join("<br>");

            return `
                <div class="lucid-toolpopup-explain-group">
                    <div class="lucid-toolpopup-definition">
                        <span class="${posClass}">${group.pos}</span>
                        ${defs}
                    </div>
                </div>
            `;
        }).join('');

        popup.innerHTML = `
            <div class="lucid-toolpopup-header">
                <span class="lucid-toolpopup-word">${wordDetails.word}</span>
                <div class="lucid-toolpopup-header-icons">
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>
                    <svg class="icon-heart" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </div>
            </div>
            <div class="lucid-toolpopup-phonetic">
                ${phoneticHTML}
            </div>
            <div class="lucid-toolpopup-definitions-area">
                ${definitionsHTML}
            </div>
            <div class="lucid-toolpopup-footer">
                <div class="lucid-toolpopup-history">
                    <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
                    <span class="lucid-toolpopup-history-count">1</span>
                </div>
                <div class="lucid-toolpopup-actions">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                    <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                </div>
            </div>
        `;
        return popup;
    }

    /**
     * Positions the toolpopup on the screen.
     * For now, it will position it near the center, or near the targetElement if provided.
     */
    private positionToolpopup(toolpopupEl: HTMLElement, referenceEl?: HTMLElement): void {
        const popupRect = toolpopupEl.getBoundingClientRect();
        let top, left;

        if (referenceEl) {
            const refRect = referenceEl.getBoundingClientRect();
            top = refRect.bottom + 10 + window.scrollY; // Below the reference element
            left = refRect.left + window.scrollX;

            // Adjust if it goes off screen horizontally
            if (left + popupRect.width > window.innerWidth - 10) {
                left = window.innerWidth - popupRect.width - 10;
            }
            if (left < 10) {
                left = 10;
            }
            // Adjust if it goes off screen vertically (prefer showing below, then above)
            if (top + popupRect.height > window.innerHeight - 10) {
                top = refRect.top - popupRect.height - 10 + window.scrollY;
                if (top < 10 + window.scrollY) { // If still off-screen (e.g. reference is tall)
                    top = window.innerHeight / 2 - popupRect.height / 2 + window.scrollY; // Center vertically
                }
            }

        } else {
            // Default to center of the viewport
            top = (window.innerHeight / 2) - (popupRect.height / 2) + window.scrollY;
            left = (window.innerWidth / 2) - (popupRect.width / 2) + window.scrollX;
        }

        toolpopupEl.style.position = 'absolute';
        toolpopupEl.style.top = `${top}px`;
        toolpopupEl.style.left = `${left}px`;
        toolpopupEl.style.zIndex = '2147483647'; // Max z-index
    }

    /**
     * Shows the toolpopup with detailed information for the given word.
     */
    public async showToolpopup(word: string, referenceElement?: HTMLElement): Promise<void> {
        if (this.currentToolpopup) {
            this.hideToolpopup();
        }

        const wordDetails = await this.getWordDetailedInfo(word);
        if (!wordDetails) {
            console.warn(`[ToolpopupManager] No detailed info found for: ${word}`);
            return;
        }

        this.currentToolpopup = this.createToolpopupElement(wordDetails);
        document.body.appendChild(this.currentToolpopup);

        // Position after it's added to DOM and rendered to get correct dimensions
        requestAnimationFrame(() => {
            if (this.currentToolpopup) {
                this.positionToolpopup(this.currentToolpopup, referenceElement);
                // Add a class for entrance animation if desired
                this.currentToolpopup.style.opacity = '0'; // Start transparent
                this.currentToolpopup.style.transform = 'scale(0.95)';
                requestAnimationFrame(() => {
                    if (this.currentToolpopup) {
                        this.currentToolpopup.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
                        this.currentToolpopup.style.opacity = '1';
                        this.currentToolpopup.style.transform = 'scale(1)';
                    }
                });
            }
        });
    }

    /**
     * Hides the currently visible toolpopup.
     */
    public hideToolpopup(): void {
        if (this.currentToolpopup) {
            // Add a class for exit animation if desired
            this.currentToolpopup.style.transition = 'opacity 0.15s ease-in, transform 0.15s ease-in';
            this.currentToolpopup.style.opacity = '0';
            this.currentToolpopup.style.transform = 'scale(0.95)';

            setTimeout(() => {
                if (this.currentToolpopup) {
                    this.currentToolpopup.remove();
                    this.currentToolpopup = null;
                }
            }, 150); // Match transition time
        }
    }
}

// Example usage (for testing directly in console or another script):
// ToolpopupManager.getInstance().showToolpopup("Project");
// setTimeout(() => ToolpopupManager.getInstance().hideToolpopup(), 5000); 