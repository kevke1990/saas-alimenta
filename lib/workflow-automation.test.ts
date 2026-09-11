import { describe, expect, it } from "vitest";
import { buildEmailDraft, suggestWorkflowTasks } from "./workflow-automation";

describe("workflow automation", () => {
  it("suggests urgent follow-up for overdue tasks", () => {
    const suggestions = suggestWorkflowTasks({ reviewStatus: "FINAL", hasCalculation: true, proposedIncomeFacts: 0, documentsAwaitingReview: 0, overdueTasks: 2, todayTasks: 0 });
    expect(suggestions[0]).toMatchObject({ key: "OVERDUE_FOLLOWUP", priority: "URGENT", dueDays: 0 });
  });

  it("does not suggest work that has no trigger", () => {
    expect(suggestWorkflowTasks({ reviewStatus: "FINAL", hasCalculation: true, proposedIncomeFacts: 0, documentsAwaitingReview: 0, overdueTasks: 0, todayTasks: 0 })).toEqual([]);
  });

  it("produces a safe reviewable email draft", () => {
    const draft = buildEmailDraft("Dossier 42", "Jan", "de stukken te bespreken");
    expect(draft.subject).toContain("Dossier 42");
    expect(draft.body).toContain("de stukken te bespreken");
    expect(draft.to).toBe("");
  });
});
