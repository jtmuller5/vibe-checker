import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { expect } from "vitest";

// ==========================================
// Types
// ==========================================
export interface EvaluationResult {
  criteria: string;
  reason: string;
  score: number;
  passed: boolean;
}

export interface EvaluationCriteria {
  type: string;
  prompt: string;
}

// ==========================================
// Metrics
// ==========================================
export const AccuracyCriteria: EvaluationCriteria = {
  type: "Accuracy",
  prompt: "How accurate is the response?",
};

export const RelevanceCriteria: EvaluationCriteria = {
  type: "Relevance",
  prompt: "How relevant is the response relative to the input?",
};

// ==========================================
// Vibe Checker
// ==========================================
export function setupModel() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  return model;
}

/**
 * Evaluates the dynamic alignment of actual output with the expected output based on specified criteria.
 * Utilizes a Gemini model to generate a reasoning-based evaluation of the provided texts.
 *
 * @param {string} input - The original input question or statement provided to generate the outputs.
 * @param {string} actualOutput - The actual output generated in response to the input.
 * @param {string} expectedOutput - The expected output that ideally should be generated from the input.
 * @param {EvaluationCriteria[]} criteria - An array of criteria used to evaluate the output. Each criterion should describe an aspect of evaluation such as accuracy, relevance, etc.
 * @returns {Promise<{score: number, reasons: string[]}[]>} A promise that resolves to an array of objects containing a numerical score and an array of reasons supporting the score for each criterion.
 */
export async function evaluateDynamicMetric({
  input,
  actualOutput,
  expectedOutput,
  criteria,
}: {
  input: string;
  actualOutput: string;
  expectedOutput: string;
  criteria: EvaluationCriteria[];
}): Promise<EvaluationResult[]> {
  const model = setupModel();

  const prompt = `
	    Evaluate the following input, actual response and expected response based on a given set of criteria.
	    For each criterion, provide it's own score object.
	    Respond with a JSON of the following format: {
	      criteria: string - corresponds to the criteria being evaluated;
	      score: number - the score between 0 to 1 assigned to the actual output based on the criterion;
	      reason: string - an array of reasons supporting the score assigned to the actual output (1 liner).
	    }
    `;

  const results: EvaluationResult[] = [];

  for (const criterion of criteria) {
    const evaluationSchema = {
      description: "Evaluation result",
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          criteria: {
            type: SchemaType.STRING,
            description: "The criteria being evaluated",
            nullable: false,
          },
          score: {
            type: SchemaType.NUMBER,
            description:
              "The score between 0 to 1 assigned to the actual output based on the criterion",
            nullable: false,
          },
          reason: {
            type: SchemaType.STRING,
            description:
              "An array of reasons supporting the score assigned to the actual output (1 liner)",
            nullable: false,
          },
        },
        required: ["criteria", "score", "reason"],
      },
    };

    const response = await model.generateContent({
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
      systemInstruction: prompt,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
					Input: ${input}
			    Expected Output: ${expectedOutput}
			    Actual Output: ${actualOutput}
			    Criteria: ${criterion.type}
          Criteria Prompt: ${criterion.prompt}
				`,
            },
          ],
        },
      ],
    });

    const evaluations: EvaluationResult[] = JSON.parse(
      response.response.text()
    );

    if (!evaluations || evaluations.length === 0) {
      results.push({
        criteria: criterion.type,
        score: 0,
        reason: "Failed to get valid response from OpenAI",
        passed: false,
      });
      continue;
    }

    try {
      for (const evaluation of evaluations) {
        results.push({
          criteria: criterion.type,
          score: evaluation.score,
          reason: evaluation.reason,
          passed: evaluation.score >= 0.5,
        });
      }

      /* console.table(
        results.map((r) => ({
          Criteria: r.criteria,
          Score: r.score,
          Passed: r.passed,
          // Reason: r.reason,
        }))
      ); */
    } catch (error) {
      console.log("Failed to parse model response", error);
    }
  }

  return results;
}

export const evaluateResponse = async ({
  input,
  actualOutput,
  expectedOutput,
  criteria = [AccuracyCriteria],
}: {
  input: string;
  actualOutput: string;
  expectedOutput: string;
  criteria?: EvaluationCriteria[];
}) => {
  const result = await evaluateDynamicMetric({
    input,
    actualOutput,
    expectedOutput,
    criteria,
  });

  expect(result.every((r) => r.passed)).toBe(true);
};
