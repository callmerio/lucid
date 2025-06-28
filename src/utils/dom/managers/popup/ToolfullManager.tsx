/**
 * @file ToolfullManager.ts
 * @description Manager for the detailed word information popup.
 * This manager is responsible for subscribing to global events and triggering the display of the toolfull via the PopupService.
 */

import { popupService } from "@services/PopupService";
import { dataService } from "@services/DataService";
import { UI_EVENTS } from "@constants/uiEvents";
import { simpleEventManager } from "../../simpleEventManager";
import { Toolfull } from "@components/ui/Toolfull";
import React from "react";

export class ToolfullManager {
  private static instance: ToolfullManager;

  private constructor() {
    this.setupGlobalEventListeners();
  }

  public static getInstance(): ToolfullManager {
    if (!ToolfullManager.instance) {
      ToolfullManager.instance = new ToolfullManager();
    }
    return ToolfullManager.instance;
  }

  private setupGlobalEventListeners(): void {
    simpleEventManager.subscribeGlobalEvent(
      UI_EVENTS.TOOLTIP.TRANSITION_TO_POPUP,
      (event) => {
        const { word, targetElement } = event.payload;
        this.showToolfull(word, targetElement);
      },
      {},
      "ToolfullManager"
    );
  }

  public async showToolfull(
    word: string,
    referenceElement?: HTMLElement
  ): Promise<void> {
    console.log(`[ToolfullManager] Request to show toolfull for: "${word}"`);

    // 从DataService获取单词详情
    const wordDetails = await dataService.getWordDetails(word);
    if (!wordDetails) {
      console.warn(`[ToolfullManager] No detailed info found for: ${word}`);
      return;
    }

    const popupId = `toolfull-${word}`;

    const toolfullElement = (
      <Toolfull
        word={word}
        wordData={wordDetails}
        onClose={() => this.hideToolfull(word)}
      />
    );

    popupService.show(popupId, toolfullElement, {
      targetElement: referenceElement,
    });
  }

  public hideToolfull(word: string): void {
    const popupId = `toolfull-${word}`;
    popupService.hide(popupId);
  }

  public destroy(): void {
    // Here you could add logic to unsubscribe from global events if needed.
    console.log("[ToolfullManager] Destroyed");
  }
}
