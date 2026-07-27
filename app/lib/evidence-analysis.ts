import type { ProblemProfile } from "./problem-taxonomy.ts";

type AnalyzableSource = {
  id: string;
  name: string;
  kind: string;
  content: string;
  size?: number;
  truncated?: boolean;
};

export type EvidenceInsight = {
  id: string;
  type: "finding" | "risk" | "opportunity";
  title: string;
  detail: string;
  evidenceIds: string[];
};

export type RequiredAction = {
  id: string;
  title: string;
  reason: string;
  question: string;
  options: string[];
};

export type DatasetColumnProfile = {
  name: string;
  type: "number" | "text" | "datetime";
  missing: number;
  unique: number;
};

export type EvidenceAnalysis = {
  dataset?: {
    sourceId: string;
    fileName: string;
    rowsAnalyzed: number;
    columnCount: number;
    columns: DatasetColumnProfile[];
    targetCandidates: string[];
    numericFeatures: string[];
    timeColumns: string[];
    truncated: boolean;
  };
  insights: EvidenceInsight[];
  requiredActions: RequiredAction[];
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

function parseNumber(value: string) {
  const normalized = value.replace(/[%$\s]/g, "");
  if (!normalized || !Number.isFinite(Number(normalized))) return null;
  return Number(normalized);
}

function pearson(left: Array<number | null>, right: Array<number | null>) {
  const pairs = left
    .map((value, index) => [value, right[index]] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null);
  if (pairs.length < 5) return null;
  const leftMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const rightMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (const [leftValue, rightValue] of pairs) {
    const leftDelta = leftValue - leftMean;
    const rightDelta = rightValue - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator ? numerator / denominator : null;
}

function profileCsv(source: AnalyzableSource, goal: string) {
  const lines = source.content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(lines[0] ?? "").map((header, index) => header || `column_${index + 1}`);
  const rows = lines.slice(1, 20_001)
    .map(parseCsvLine)
    .filter((row) => row.length === headers.length);
  const valuesByColumn = headers.map((_, columnIndex) => rows.map((row) => row[columnIndex] ?? ""));
  const columns: DatasetColumnProfile[] = headers.map((name, index) => {
    const values = valuesByColumn[index];
    const present = values.filter((value) => value !== "");
    const numericCount = present.filter((value) => parseNumber(value) !== null).length;
    const nameSuggestsTime = /(^|_|\s)(date|time|timestamp|hour|day|month|year)($|_|\s)/i.test(name);
    const dateCount = nameSuggestsTime
      ? present.filter((value) => !Number.isNaN(Date.parse(value))).length
      : 0;
    const type = present.length && numericCount / present.length >= 0.85
      ? "number"
      : present.length && dateCount / present.length >= 0.7
        ? "datetime"
        : "text";
    return {
      name,
      type,
      missing: values.length - present.length,
      unique: new Set(present.slice(0, 10_000)).size,
    };
  });

  const goalWords = new Set(goal.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3));
  const targetCandidates = headers
    .map((name) => {
      const normalized = name.toLowerCase();
      let score = 0;
      if (/(target|output|yield|production|result|response)/.test(normalized)) score += 5;
      if (normalized.includes("biogas") && goalWords.has("biogas")) score += 5;
      if ([...goalWords].some((word) => normalized.includes(word))) score += 2;
      const profile = columns.find((column) => column.name === name);
      if (profile?.type === "number") score += 1;
      return { name, score };
    })
    .filter((candidate) => candidate.score >= 5)
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.name)
    .slice(0, 5);
  const numericFeatures = columns.filter((column) => column.type === "number").map((column) => column.name);
  const timeColumns = columns.filter((column) => column.type === "datetime" ||
    /(^|_|\s)(date|time|timestamp|hour)($|_|\s)/i.test(column.name)).map((column) => column.name);

  const target = targetCandidates.find((candidate) => numericFeatures.includes(candidate));
  const correlations = target
    ? numericFeatures
        .filter((feature) => feature !== target)
        .map((feature) => {
          const leftIndex = headers.indexOf(feature);
          const rightIndex = headers.indexOf(target);
          return {
            feature,
            correlation: pearson(
              valuesByColumn[leftIndex].map(parseNumber),
              valuesByColumn[rightIndex].map(parseNumber),
            ),
          };
        })
        .filter((item): item is { feature: string; correlation: number } => item.correlation !== null)
        .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
        .slice(0, 3)
    : [];

  return {
    rows,
    headers,
    columns,
    targetCandidates,
    numericFeatures,
    timeColumns,
    correlations,
    truncated: Boolean(source.truncated || (source.size && source.content.length < source.size)),
  };
}

export function analyzeProblemEvidence(input: {
  goal: string;
  sources: AnalyzableSource[];
  problemProfile: ProblemProfile;
}): EvidenceAnalysis {
  const csv = input.sources.find((source) => source.kind === "csv" || source.name.toLowerCase().endsWith(".csv"));

  if (input.problemProfile.domain !== "machine-learning" || !csv) {
    return {
      insights: [
        {
          id: "problem-classification",
          type: "finding",
          title: `${input.problemProfile.domainLabel} problem confirmed`,
          detail: input.problemProfile.interpretation,
          evidenceIds: input.sources.map((source) => source.id).slice(0, 3),
        },
        {
          id: "evidence-coverage",
          type: "opportunity",
          title: `${input.sources.length} evidence source${input.sources.length === 1 ? "" : "s"} available`,
          detail: "The execution map can now connect the stated objective to the supplied records and decisions.",
          evidenceIds: input.sources.map((source) => source.id).slice(0, 3),
        },
      ],
      requiredActions: input.problemProfile.clarificationQuestions.map((question, index) => ({
        id: `clarification-${index + 1}`,
        title: index === 0 ? "Confirm the first success outcome" : "Confirm the control boundary",
        reason: "This decision changes the generated application's rules and evaluation plan.",
        question,
        options: [],
      })),
    };
  }

  const profile = profileCsv(csv, input.goal);
  const target = profile.targetCandidates[0];
  const missingCells = profile.columns.reduce((total, column) => total + column.missing, 0);
  const strongest = profile.correlations[0];
  const insights: EvidenceInsight[] = [
    {
      id: "dataset-shape",
      type: "finding",
      title: `${profile.rows.length.toLocaleString()} rows analyzed across ${profile.headers.length} columns`,
      detail: `${profile.numericFeatures.length} columns appear numeric and can be evaluated as model inputs.${profile.truncated ? " The uploaded preview was truncated, so totals may be higher." : ""}`,
      evidenceIds: [csv.id],
    },
    target
      ? {
          id: "target-candidate",
          type: "opportunity",
          title: `"${target}" is the strongest target candidate`,
          detail: `Its name matches the requested outcome. Neural Knights will not train until you confirm that this is the value to predict.`,
          evidenceIds: [csv.id],
        }
      : {
          id: "target-missing",
          type: "risk",
          title: "No target column can be inferred safely",
          detail: "A supervised model needs one outcome column. Select it before choosing features or algorithms.",
          evidenceIds: [csv.id],
        },
    strongest
      ? {
          id: "strongest-relationship",
          type: "finding",
          title: `${strongest.feature} has the strongest simple relationship with ${target}`,
          detail: `Pearson correlation is ${strongest.correlation.toFixed(2)} in the analyzed rows. This is a screening signal, not proof of causation or model quality.`,
          evidenceIds: [csv.id],
        }
      : {
          id: "relationship-pending",
          type: "risk",
          title: "Feature relationships are waiting on target confirmation",
          detail: "After the target is confirmed, numeric features can be ranked and checked for leakage.",
          evidenceIds: [csv.id],
        },
  ];

  if (missingCells > 0) {
    insights.push({
      id: "missing-values",
      type: "risk",
      title: `${missingCells.toLocaleString()} missing values found`,
      detail: "The training plan needs an explicit missing-value strategy before a trustworthy baseline can run.",
      evidenceIds: [csv.id],
    });
  } else {
    insights.push({
      id: "missing-values",
      type: "finding",
      title: "No missing cells found in the analyzed rows",
      detail: "Type validation, outlier checks, and leakage checks are still required.",
      evidenceIds: [csv.id],
    });
  }

  if (profile.timeColumns.length) {
    insights.push({
      id: "time-order",
      type: "risk",
      title: `Time ordering detected through ${profile.timeColumns.join(", ")}`,
      detail: "Use a chronological holdout instead of a random split to reduce future-data leakage.",
      evidenceIds: [csv.id],
    });
  }

  const targetOptions = profile.targetCandidates.length
    ? profile.targetCandidates
    : profile.columns.filter((column) => column.type === "number").map((column) => column.name).slice(0, 12);
  const requiredActions: RequiredAction[] = [
    {
      id: "confirm-target",
      title: target ? `Confirm "${target}" as the prediction target` : "Select the prediction target",
      reason: "Feature ranking, model choice, and evaluation are meaningless until the outcome column is known.",
      question: "Which column should the model predict?",
      options: targetOptions,
    },
    {
      id: "confirm-metric",
      title: "Choose the model success metric",
      reason: "The metric defines whether a candidate model is actually better than the baseline.",
      question: "How should prediction quality be ranked?",
      options: ["MAE - average absolute error", "RMSE - penalize large errors", "R2 - explained variance"],
    },
    {
      id: "confirm-validation",
      title: "Confirm the validation strategy",
      reason: profile.timeColumns.length
        ? "Hourly or dated observations should be tested on later data, not randomly mixed."
        : "A fixed holdout prevents training performance from being mistaken for real predictive quality.",
      question: "How should unseen data be held out?",
      options: profile.timeColumns.length
        ? ["Chronological holdout", "Walk-forward validation"]
        : ["Fixed random holdout", "K-fold cross-validation"],
    },
  ];

  return {
    dataset: {
      sourceId: csv.id,
      fileName: csv.name,
      rowsAnalyzed: profile.rows.length,
      columnCount: profile.headers.length,
      columns: profile.columns,
      targetCandidates: profile.targetCandidates,
      numericFeatures: profile.numericFeatures,
      timeColumns: profile.timeColumns,
      truncated: profile.truncated,
    },
    insights,
    requiredActions,
  };
}
