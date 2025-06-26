/**
 * @file Toolfull.tsx
 * @description Renders the detailed content for a word popup.
 * This is a pure UI component that receives all its data and handlers via props.
 */

import React from "react";
import "./Toolfull.css";
import { WordDetails } from "../../types/services";
import { BaseComponentProps } from "../types";

interface ToolfullProps extends BaseComponentProps {
  word: string;
  wordData: WordDetails;
  onClose: () => void;
  // Future event handlers can be added here, e.g.:
  // onPlayPronunciation: (region: 'us' | 'uk') => void;
  // onToggleFavorite: () => void;
}

export const Toolfull: React.FC<ToolfullProps> = ({
  word,
  wordData,
  onClose,
  className = "",
}) => {
  // Helper to create phonetic elements
  const renderPhonetic = (region: "us" | "uk", phonetic: string) => (
    <div className={`lucid-toolfull-phonetic-group ${region}-phonetic`}>
      <span className="lucid-toolfull-phonetic-region">
        {region.toUpperCase()}
      </span>
      <span className="lucid-toolfull-phonetic-text">{phonetic}</span>
    </div>
  );

  return (
    <div className={`lucid-toolfull lucid-toolfull-visible ${className}`}>
      <div className="lucid-toolfull-header">
        <div className="lucid-toolfull-title">
          <span className="lucid-toolfull-word">{wordData.word}</span>
        </div>
        <button className="close-button" onClick={onClose} aria-label="关闭">
          ✕
        </button>
      </div>

      <div className="lucid-toolfull-phonetic">
        {wordData.phonetic?.us && renderPhonetic("us", wordData.phonetic.us)}
        {wordData.phonetic?.uk && renderPhonetic("uk", wordData.phonetic.uk)}
      </div>

      <div className="lucid-toolfull-definitions-area">
        {wordData.explain.map((explanation, index) => (
          <div key={index} className="lucid-toolfull-explain-group">
            <div className="lucid-toolfull-definition">
              <span
                className={`lucid-toolfull-pos pos-${explanation.pos.toLowerCase().replace(" ", "-")}`}
              >
                {explanation.pos}
              </span>
              {explanation.definitions.map((def, defIndex) => (
                <span
                  key={defIndex}
                  className="lucid-toolfull-definition-text-chinese"
                >
                  {def.chinese_short || def.chinese}
                  <span className="lucid-toolfull-definition-text-english-tooltip">
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
