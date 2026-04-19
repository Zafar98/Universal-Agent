// In-memory case storage for MVP
import { CallCase } from "./types";

class CaseLoggerService {
  private cases: Map<string, CallCase> = new Map();
  private caseCounter: number = 0;

  createCase(caseData: Partial<CallCase>): CallCase {
    const id = `CASE-${Date.now()}-${++this.caseCounter}`;
    const newCase: CallCase = {
      id,
      issueType: caseData.issueType || "general",
      description: caseData.description || "",
      location: caseData.location || "",
      postcode: caseData.postcode || "",
      dateOfBirth: caseData.dateOfBirth || "",
      timestamp: new Date(),
      status: "open",
    };

    this.cases.set(id, newCase);
    console.log("Case created:", newCase);
    return newCase;
  }

  updateCase(id: string, updates: Partial<CallCase>): CallCase | null {
    const existingCase = this.cases.get(id);
    if (!existingCase) return null;

    const updated = { ...existingCase, ...updates };
    this.cases.set(id, updated);
    console.log("Case updated:", updated);
    return updated;
  }

  getCase(id: string): CallCase | null {
    return this.cases.get(id) || null;
  }

  getAllCases(): CallCase[] {
    return Array.from(this.cases.values());
  }

  closeCase(id: string): CallCase | null {
    const caseData = this.cases.get(id);
    if (!caseData) return null;

    const updated = { ...caseData, status: "closed" as const };
    this.cases.set(id, updated);
    return updated;
  }
}

// Export singleton instance
export const caseLogger = new CaseLoggerService();
