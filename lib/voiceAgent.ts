// Voice Agent Logic for MVP
// This handles the conversation flow and integrates with OpenAI Realtime API

export interface ConversationStep {
  step: "greeting" | "verification" | "issue_capture" | "follow_up" | "closing";
  agentMessage: string;
  expectedUserAction: string;
}

export class VoiceAgentController {
  private currentStep: ConversationStep["step"] = "greeting";
  private conversationData: {
    postcode?: string;
    dateOfBirth?: string;
    issueType?: string;
    description?: string;
    location?: string;
  } = {};

  getGreeting(): string {
    return "Thank you for calling Developers Housing. May I take your postcode and date of birth?";
  }

  getVerificationPrompt(missingFields: Array<"postcode" | "dateOfBirth">): string {
    if (missingFields.length === 2) {
      return "I still need your postcode and date of birth. Please say them again, slowly.";
    }

    if (missingFields[0] === "postcode") {
      return "Thanks. I still need your postcode. Please say it slowly, including the last three characters.";
    }

    return "Thanks. I still need your date of birth. Please say the day, month, and year.";
  }

  getHelpRequest(): string {
    return "Thank you for providing your information. How can I help you today?";
  }

  getFollowUpQuestion(issueType: string, questionNumber: number): string {
    const followUps: { [key: string]: string[] } = {
      repair: [
        "Can you tell me where exactly the issue is located?",
        "When did this issue start?",
      ],
      complaint: [
        "What specifically would you like to report?",
        "When did this happen?",
      ],
      general: [
        "Can you provide more details?",
        "Is there anything else I should know?",
      ],
    };

    const questions = followUps[issueType] || followUps["general"];
    return questions[Math.min(questionNumber, questions.length - 1)];
  }

  getClosingMessage(): string {
    return "Alright, I've got that logged for you. Is there anything else I can help with today?";
  }

  getEndCall(): string {
    return "Thank you for calling. Have a great day!";
  }

  updateConversationData(data: Partial<typeof this.conversationData>): void {
    this.conversationData = { ...this.conversationData, ...data };
  }

  getConversationData() {
    return this.conversationData;
  }

  setCurrentStep(step: ConversationStep["step"]): void {
    this.currentStep = step;
  }

  getCurrentStep(): ConversationStep["step"] {
    return this.currentStep;
  }

  // Simple intent detection (for MVP - no ML)
  detectIntent(userInput: string): {
    type: "repair" | "complaint" | "general" | "end";
    confidence: number;
  } {
    const input = userInput.toLowerCase();

    if (
      input.includes("bye") ||
      input.includes("goodbye") ||
      input.includes("thanks") ||
      input.includes("that's all")
    ) {
      return { type: "end", confidence: 0.9 };
    }

    if (
      input.includes("broken") ||
      input.includes("fix") ||
      input.includes("repair") ||
      input.includes("leak") ||
      input.includes("heating")
    ) {
      return { type: "repair", confidence: 0.8 };
    }

    if (
      input.includes("complain") ||
      input.includes("problem") ||
      input.includes("issue") ||
      input.includes("concerned")
    ) {
      return { type: "complaint", confidence: 0.7 };
    }

    return { type: "general", confidence: 0.5 };
  }

  // Validate and extract postcode from user input
  extractPostcode(userInput: string): string | null {
    const normalizedInput = userInput.toUpperCase().replace(/[^A-Z0-9\s]/g, " ");
    const compactInput = normalizedInput.replace(/\s+/g, "");
    const compactMatch = compactInput.match(/[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}/);

    if (!compactMatch) {
      return null;
    }

    const compactPostcode = compactMatch[0];
    return `${compactPostcode.slice(0, -3)} ${compactPostcode.slice(-3)}`;
  }

  // Validate and extract date of birth from user input
  extractDateOfBirth(
    userInput: string
  ): { day: string; month: string; year: string } | null {
    const numericDateMatch = userInput.match(/(\d{1,2})(?:st|nd|rd|th)?[\/-\s]+(\d{1,2})[\/-\s]+(\d{4})/i);
    if (numericDateMatch) {
      return {
        day: numericDateMatch[1].padStart(2, "0"),
        month: numericDateMatch[2].padStart(2, "0"),
        year: numericDateMatch[3],
      };
    }

    const monthMap: Record<string, string> = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
    };

    const spokenDateMatch = userInput
      .toLowerCase()
      .match(/(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);

    if (spokenDateMatch) {
      return {
        day: spokenDateMatch[1].padStart(2, "0"),
        month: monthMap[spokenDateMatch[2].toLowerCase()],
        year: spokenDateMatch[3],
      };
    }

    const reversedSpokenDateMatch = userInput
      .toLowerCase()
      .match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})/i);

    if (reversedSpokenDateMatch) {
      return {
        day: reversedSpokenDateMatch[2].padStart(2, "0"),
        month: monthMap[reversedSpokenDateMatch[1].toLowerCase()],
        year: reversedSpokenDateMatch[3],
      };
    }

    const dateMatch = userInput.match(/(\d{1,2})[\/-\s](\d{1,2})[\/-\s](\d{4})/);
    if (dateMatch) {
      return {
        day: dateMatch[1].padStart(2, "0"),
        month: dateMatch[2].padStart(2, "0"),
        year: dateMatch[3],
      };
    }
    return null;
  }

  // Extract location from user input
  extractLocation(userInput: string): string | null {
    // For MVP, just capture key locations
    const locations = ["kitchen", "bedroom", "bathroom", "living room", "lounge", "hallway"];
    const input = userInput.toLowerCase();

    for (const loc of locations) {
      if (input.includes(loc)) {
        return loc;
      }
    }
    return null;
  }
}
