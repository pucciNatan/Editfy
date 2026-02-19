// src/lib/videoPreviewManager.ts

const MAX_ACTIVE_IFRAMES = 3;

type CardState = {
  id: string;
  visible: boolean;
  top: number;
  setActive: (active: boolean) => void;
};

class VideoPreviewManager {
  private cards = new Map<string, CardState>();
  private globalPause = false;

  register(id: string, setActive: (active: boolean) => void) {
    this.cards.set(id, {
      id,
      visible: false,
      top: Infinity,
      setActive,
    });
    this.recompute();
  }

  unregister(id: string) {
    const card = this.cards.get(id);
    if (card) {
      card.setActive(false);
      this.cards.delete(id);
    }
    this.recompute();
  }

  updateVisibility(id: string, visible: boolean, top: number) {
    const card = this.cards.get(id);
    if (!card) return;

    card.visible = visible;
    card.top = top;
    this.recompute();
  }

  // 🔥 NOVO: pausa global — usado quando modal abre
  pauseAll() {
    this.globalPause = true;
    for (const c of this.cards.values()) {
      c.setActive(false);
    }
  }

  // 🔥 NOVO: libera para voltar ao modo automático
  resume() {
    this.globalPause = false;
    this.recompute();
  }

  private recompute() {
    if (this.globalPause) {
      // quando pausado, ninguém toca
      for (const c of this.cards.values()) c.setActive(false);
      return;
    }

    const cards = Array.from(this.cards.values());
    const visibles = cards
      .filter((c) => c.visible)
      .sort((a, b) => a.top - b.top);

    const activeIds = new Set(
      visibles.slice(0, MAX_ACTIVE_IFRAMES).map((c) => c.id)
    );

    for (const c of cards) {
      c.setActive(activeIds.has(c.id));
    }
  }
}

export const videoPreviewManager = new VideoPreviewManager();
