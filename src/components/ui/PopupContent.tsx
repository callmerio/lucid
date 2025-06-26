/**
 * @file PopupContent.tsx
 * @description Renders the detailed content for a word popup.
 * This is a pure UI component that receives all its data and handlers via props.
 */

import React from "react";
import "./PopupContent.css";
import { WordDetails } from "../../types/services";

interface PopupContentProps {
  word: string;
  wordData: WordDetails;
  onClose: () => void;
  // Future event handlers can be added here, e.g.:
  // onPlayPronunciation: (region: 'us' | 'uk') => void;
  // onToggleFavorite: () => void;
}

export const PopupContent: React.FC<PopupContentProps> = ({
  word,
  wordData,
  onClose,
}) => {
  // Helper to create phonetic elements
  const renderPhonetic = (region: "us" | "uk", phonetic: string) => (
    <div className={`lucid-toolpopup-phonetic-group ${region}-phonetic`}>
      <span className="lucid-toolpopup-phonetic-region">
        {region.toUpperCase()}
      </span>
      <span className="lucid-toolpopup-phonetic-text">{phonetic}</span>
    </div>
  );

  return (
    <div className="lucid-tooltip-detail lucid-toolpopup-visible">
      <div className="popup-header">
        <div className="popup-title">
          <span className="lucid-toolpopup-word">{wordData.word}</span>
        </div>
        <button className="close-button" onClick={onClose} aria-label="关闭">
          ✕
        </button>
      </div>

      <div className="lucid-toolpopup-phonetic">
        {wordData.phonetic?.us && renderPhonetic("us", wordData.phonetic.us)}
        {wordData.phonetic?.uk && renderPhonetic("uk", wordData.phonetic.uk)}
      </div>

      <div className="lucid-toolpopup-definitions-area">
        {wordData.explain.map((explanation, index) => (
          <div key={index} className="lucid-toolpopup-explain-group">
            <div className="lucid-toolpopup-definition">
              <span
                className={`lucid-toolpopup-pos pos-${explanation.pos.toLowerCase().replace(" ", "-")}`}
              >
                {explanation.pos}
              </span>
              {explanation.definitions.map((def, defIndex) => (
                <span
                  key={defIndex}
                  className="lucid-toolpopup-definition-text-chinese"
                >
                  {def.chinese_short || def.chinese}
                  <span className="lucid-toolpopup-definition-text-english-tooltip">
                    {def.definition}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer can be added here if needed, with data passed via props */}
    </div>
  );
};
