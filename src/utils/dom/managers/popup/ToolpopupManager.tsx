/**
 * @file ToolpopupManager.ts
 * @description Manager for the detailed word information popup.
 * This manager is responsible for subscribing to global events and triggering the display of the toolpopup via the PopupService.
 */

import { popupService } from "@services/PopupService";
import { dataService } from "@services/DataService";
import { UI_EVENTS } from "@constants/uiEvents";
import { simpleEventManager } from "../../simpleEventManager";
import { Toolfull } from "@components/ui/Toolfull";
import React from "react";

export class ToolpopupManager {
  private static instance: ToolpopupManager;

  private constructor() {
    this.setupGlobalEventListeners();
  }

  public static getInstance(): ToolpopupManager {
    if (!ToolpopupManager.instance) {
      ToolpopupManager.instance = new ToolpopupManager();
    }
    return ToolpopupManager.instance;
  }

  private setupGlobalEventListeners(): void {
    simpleEventManager.subscribeGlobalEvent(
      UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
      (event) => {
        const { word, targetElement } = event.payload;
        this.showToolpopup(word, targetElement);
      },
      {},
      "ToolpopupManager"
    );
  }

  public async showToolpopup(
    word: string,
    referenceElement?: HTMLElement
  ): Promise<void> {
    console.log(`[ToolpopupManager] Request to show toolpopup for: "${word}"`);

    // 从DataService获取单词详情
    const wordDetails = await dataService.getWordDetails(word);
    if (!wordDetails) {
      console.warn(`[ToolpopupManager] No detailed info found for: ${word}`);
      return;
    }

    const popupId = `toolfull-${word}`;

    const toolfullElement = (
      <Toolfull
        word={word}
        wordData={wordDetails}
        onClose={() => this.hideToolpopup(word)}
      />
    );

    popupService.show(popupId, toolfullElement, {
      targetElement: referenceElement,
    });
  }

  public hideToolpopup(word: string): void {
    const popupId = `toolfull-${word}`;
    popupService.hide(popupId);
  }

  public destroy(): void {
    // Here you could add logic to unsubscribe from global events if needed.
    console.log("[ToolpopupManager] Destroyed");
  }
}
