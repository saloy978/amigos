export class InputValidationService {
  static validateAnswer(userInput: string, correctAnswer: string, options: {
    caseSensitive?: boolean;
    ignoreDiacritics?: boolean;
    ignorePunctuation?: boolean;
  } = {}): boolean {
    const {
      caseSensitive = false,
      ignoreDiacritics = true,
      ignorePunctuation = true
    } = options;

    let normalizedInput = userInput.trim();
    let normalizedAnswer = correctAnswer.trim();

    if (!caseSensitive) {
      normalizedInput = normalizedInput.toLowerCase();
      normalizedAnswer = normalizedAnswer.toLowerCase();
    }

    if (ignoreDiacritics) {
      normalizedInput = this.removeDiacritics(normalizedInput);
      normalizedAnswer = this.removeDiacritics(normalizedAnswer);
    }

    if (ignorePunctuation) {
      normalizedInput = this.removePunctuation(normalizedInput);
      normalizedAnswer = this.removePunctuation(normalizedAnswer);
    }

    return normalizedInput === normalizedAnswer;
  }

  static getPartialMatch(userInput: string, correctAnswer: string): {
    isPartialMatch: boolean;
    correctChars: number;
    totalChars: number;
  } {
    const normalizedInput = this.removeDiacritics(userInput.toLowerCase().trim());
    const normalizedAnswer = this.removeDiacritics(correctAnswer.toLowerCase().trim());

    let correctChars = 0;
    const maxLength = Math.min(normalizedInput.length, normalizedAnswer.length);

    for (let i = 0; i < maxLength; i++) {
      if (normalizedInput[i] === normalizedAnswer[i]) {
        correctChars++;
      } else {
        break;
      }
    }

    return {
      isPartialMatch: correctChars > 0,
      correctChars,
      totalChars: normalizedAnswer.length
    };
  }

  private static removeDiacritics(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private static removePunctuation(text: string): string {
    return text.replace(/[^\w\s\u0400-\u04FF]/g, '');
  }
}