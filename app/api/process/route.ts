// API route for processing conversation and generating agent responses
import { NextRequest, NextResponse } from "next/server";
import { VoiceAgentController } from "@/lib/voiceAgent";
import { caseLogger } from "@/lib/caseLogger";

class ConversationManager {
  private agent = new VoiceAgentController();
  private step = 0;
  private followUpCount = 0;
  private issueType: string | null = null;
  private caseId: string | null = null;

  getFirstMessage(): string {
    return this.agent.getGreeting();
  }

  processUserInput(userInput: string): {
    agentResponse: string;
    nextStep: string;
    shouldEndCall: boolean;
    caseData?: any;
  } {
    console.log("Processing user input:", userInput);

    // Check for end call intent
    const intent = this.agent.detectIntent(userInput);
    if (intent.type === "end" && this.step > 2) {
      const caseData = this.agent.getConversationData();
      if (this.caseId) {
        const closedCase = caseLogger.closeCase(this.caseId);
        return {
          agentResponse: this.agent.getEndCall(),
          nextStep: "closed",
          shouldEndCall: true,
          caseData: closedCase,
        };
      }
      return {
        agentResponse: this.agent.getEndCall(),
        nextStep: "closed",
        shouldEndCall: true,
      };
    }

    // Step 0: Get postcode and date of birth
    if (this.step === 0) {
      const postcode = this.agent.extractPostcode(userInput);
      const dob = this.agent.extractDateOfBirth(userInput);
      const existingData = this.agent.getConversationData();

      if (postcode) {
        this.agent.updateConversationData({ postcode });
      }
      if (dob) {
        this.agent.updateConversationData({
          dateOfBirth: `${dob.day}/${dob.month}/${dob.year}`,
        });
      }

      const hasPostcode = Boolean(postcode || existingData.postcode);
      const hasDateOfBirth = Boolean(dob || existingData.dateOfBirth);

      if (hasPostcode && hasDateOfBirth) {
        this.step = 1;
        return {
          agentResponse: this.agent.getHelpRequest(),
          nextStep: "issue_inquiry",
          shouldEndCall: false,
        };
      } else {
        const missingFields: Array<"postcode" | "dateOfBirth"> = [];

        if (!hasPostcode) {
          missingFields.push("postcode");
        }

        if (!hasDateOfBirth) {
          missingFields.push("dateOfBirth");
        }

        return {
          agentResponse: this.agent.getVerificationPrompt(missingFields),
          nextStep: "verification",
          shouldEndCall: false,
        };
      }
    }

    // Step 1: Capture issue type
    if (this.step === 1) {
      this.issueType = intent.type === "repair" ? "repair" : intent.type === "complaint" ? "complaint" : "general";

      // Create case
      const conversationData = this.agent.getConversationData();
      const newCase = caseLogger.createCase({
        postcode: conversationData.postcode,
        dateOfBirth: conversationData.dateOfBirth,
        issueType: this.issueType,
        description: userInput,
      });

      this.caseId = newCase.id;
      this.agent.updateConversationData({
        issueType: this.issueType,
        description: userInput,
      });

      this.step = 2;
      this.followUpCount = 0;

      return {
        agentResponse: this.agent.getFollowUpQuestion(this.issueType, this.followUpCount),
        nextStep: "follow_up",
        shouldEndCall: false,
      };
    }

    // Step 2 & 3: Follow-up questions
    if (this.step === 2 || this.step === 3) {
      if (this.step === 2) {
        // First follow-up: capture location
        const location = this.agent.extractLocation(userInput);
        if (location) {
          this.agent.updateConversationData({ location });
          if (this.caseId) {
            caseLogger.updateCase(this.caseId, { location });
          }
        } else {
          this.agent.updateConversationData({ location: userInput });
          if (this.caseId) {
            caseLogger.updateCase(this.caseId, { location: userInput });
          }
        }

        this.step = 3;
        this.followUpCount = 1;

        return {
          agentResponse: this.agent.getFollowUpQuestion(this.issueType || "general", this.followUpCount),
          nextStep: "follow_up",
          shouldEndCall: false,
        };
      } else if (this.step === 3) {
        // Second follow-up processed
        if (this.caseId) {
          caseLogger.updateCase(this.caseId, {
            description: `${this.agent.getConversationData().description} - ${userInput}`,
          });
        }

        this.step = 4;

        return {
          agentResponse: this.agent.getClosingMessage(),
          nextStep: "closing",
          shouldEndCall: false,
          caseData: this.caseId ? caseLogger.getCase(this.caseId) : null,
        };
      }
    }

    // Default response
    return {
      agentResponse: "I didn't quite understand that. Could you please repeat?",
      nextStep: "clarification",
      shouldEndCall: false,
    };
  }
}

// Store conversation manager instances per session
const conversationSessions = new Map<string, ConversationManager>();

export async function POST(request: NextRequest) {
  try {
    const { userText, sessionId, action } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Initialize conversation manager for this session
    if (!conversationSessions.has(sessionId)) {
      conversationSessions.set(sessionId, new ConversationManager());
    }

    const manager = conversationSessions.get(sessionId)!;

    let response;

    if (action === "start") {
      response = {
        agentMessage: manager.getFirstMessage(),
        nextStep: "verification",
        shouldEndCall: false,
      };
    } else if (action === "process" && userText) {
      response = manager.processUserInput(userText);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Clean up ended calls
    if (response.shouldEndCall) {
      conversationSessions.delete(sessionId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Process API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
