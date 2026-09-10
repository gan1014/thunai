export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: string;
  objects_mentioned?: string[];
  location_mentioned?: string;
}

export class ContextMemory {
  private history: ConversationTurn[] = [];
  private maxHistory = 20;

  constructor(maxHistory = 20) {
    this.maxHistory = maxHistory;
  }

  addTurn(
    role: 'user' | 'assistant',
    content: string,
    intent?: string,
    objects?: string[],
    location?: string
  ): void {
    this.history.push({
      role,
      content,
      timestamp: Date.now(),
      intent,
      objects_mentioned: objects,
      location_mentioned: location,
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(): ConversationTurn[] {
    return [...this.history];
  }

  getLastMentionedObject(): string | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const turn = this.history[i];
      if (turn.objects_mentioned && turn.objects_mentioned.length > 0) {
        return turn.objects_mentioned[turn.objects_mentioned.length - 1];
      }
    }
    return null;
  }

  getLastMentionedLocation(): string | null {
    for (let i = this.history.length - 1; i >= 0; i--) {
      const turn = this.history[i];
      if (turn.location_mentioned) {
        return turn.location_mentioned;
      }
    }
    return null;
  }

  /**
   * Coreference Resolution:
   * Replaces ambiguous pronouns ("it", "that", "this", "there") with the last mentioned object/location.
   */
  resolveReference(text: string): { resolvedText: string; resolvedReference?: string } {
    if (!text) return { resolvedText: '' };

    const lastObj = this.getLastMentionedObject();
    const lastLoc = this.getLastMentionedLocation();
    let modified = text;
    let resolvedRef: string | undefined;

    // Check for "there" -> location
    if (lastLoc && /\bthere\b/i.test(modified)) {
      modified = modified.replace(/\bthere\b/gi, `at ${lastLoc}`);
      resolvedRef = lastLoc;
    }

    // Check for "it", "that", "this" -> object
    if (lastObj && /\b(it|that|this)\b/i.test(modified)) {
      modified = modified.replace(/\b(it|that|this)\b/gi, `the ${lastObj.replace('_', ' ')}`);
      resolvedRef = lastObj;
    }

    return { resolvedText: modified, resolvedReference: resolvedRef };
  }

  clear(): void {
    this.history = [];
  }
}

export const contextMemory = new ContextMemory();
