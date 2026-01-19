/**
 * Calculator Service
 *
 * Performs statistical calculations on parsed assessment data:
 * - Question statistics (average, standard deviation, distribution)
 * - Driver averages
 * - Respondent summaries (overall average, highest/lowest drivers, outliers)
 */

/**
 * Calculates the mean of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Mean value (2 decimal places)
 */
function calculateAverage(values) {
  const validValues = values.filter(v => v !== null && !isNaN(v));
  if (validValues.length === 0) return 0;

  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return Number((sum / validValues.length).toFixed(2));
}

/**
 * Calculates the standard deviation of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Standard deviation (2 decimal places)
 */
function calculateStdDev(values) {
  const validValues = values.filter(v => v !== null && !isNaN(v));
  if (validValues.length === 0) return 0;

  const avg = calculateAverage(validValues);
  const squareDiffs = validValues.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / validValues.length;
  return Number(Math.sqrt(avgSquareDiff).toFixed(2));
}

/**
 * Calculates the distribution of scores (count of 1s, 2s, 3s, 4s, 5s)
 * @param {number[]} values - Array of numeric values (1-5)
 * @returns {number[]} Array of counts [count1s, count2s, count3s, count4s, count5s]
 */
function calculateDistribution(values) {
  const validValues = values.filter(v => v !== null && !isNaN(v));
  const distribution = [0, 0, 0, 0, 0]; // Indices 0-4 for scores 1-5

  validValues.forEach(value => {
    if (value >= 1 && value <= 5) {
      distribution[value - 1]++;
    }
  });

  return distribution;
}

/**
 * Enriches questions with statistical calculations
 * @param {Object[]} questions - Array of question objects with responses
 * @returns {Object[]} Questions with added average, stdDev, and distribution
 */
function calculateQuestionStats(questions) {
  return questions.map(question => ({
    ...question,
    average: calculateAverage(question.responses),
    stdDev: calculateStdDev(question.responses),
    distribution: calculateDistribution(question.responses)
  }));
}

/**
 * Calculates average score for each driver
 * @param {Object[]} questions - Questions with calculated averages
 * @returns {Object} Driver scores { driverName: average }
 */
function calculateDriverScores(questions) {
  const driverGroups = {};

  // Group questions by driver
  questions.forEach(question => {
    if (!driverGroups[question.driver]) {
      driverGroups[question.driver] = [];
    }
    driverGroups[question.driver].push(question.average);
  });

  // Calculate average for each driver
  const driverScores = {};
  Object.keys(driverGroups).forEach(driver => {
    driverScores[driver] = calculateAverage(driverGroups[driver]);
  });

  return driverScores;
}

/**
 * Finds the highest and lowest scoring drivers
 * @param {Object} driverScores - Object with driver scores
 * @returns {Object} { strongest: {name, score}, weakest: {name, score} }
 */
function findExtremeDrivers(driverScores) {
  const drivers = Object.entries(driverScores);

  if (drivers.length === 0) {
    return { strongest: null, weakest: null };
  }

  let strongest = drivers[0];
  let weakest = drivers[0];

  drivers.forEach(([name, score]) => {
    if (score > strongest[1]) strongest = [name, score];
    if (score < weakest[1]) weakest = [name, score];
  });

  return {
    strongest: { name: strongest[0], score: strongest[1] },
    weakest: { name: weakest[0], score: weakest[1] }
  };
}

/**
 * Calculates summary statistics for each respondent
 * @param {Object[]} respondents - Array of respondent objects with scores
 * @param {Object[]} questions - Questions with calculated averages
 * @param {Object} driverScores - Driver average scores
 * @returns {Object[]} Respondents with added summary statistics
 */
function calculateRespondentSummaries(respondents, questions, driverScores) {
  return respondents.map(respondent => {
    // Calculate overall average for respondent
    const overallAverage = calculateAverage(respondent.scores);

    // Calculate respondent's average per driver
    const respondentDriverScores = {};
    const driverGroups = {};

    questions.forEach((question, index) => {
      const score = respondent.scores[index];
      if (score !== null && !isNaN(score)) {
        if (!driverGroups[question.driver]) {
          driverGroups[question.driver] = [];
        }
        driverGroups[question.driver].push(score);
      }
    });

    Object.keys(driverGroups).forEach(driver => {
      respondentDriverScores[driver] = calculateAverage(driverGroups[driver]);
    });

    // Find highest and lowest drivers for this respondent
    const driverEntries = Object.entries(respondentDriverScores);
    let highestDriver = driverEntries[0];
    let lowestDriver = driverEntries[0];

    driverEntries.forEach(([name, score]) => {
      if (score > highestDriver[1]) highestDriver = [name, score];
      if (score < lowestDriver[1]) lowestDriver = [name, score];
    });

    // Find outlier questions (where respondent differs significantly from team)
    const outlierQuestions = [];
    const outlierThreshold = 1.5; // Difference of 1.5 or more is considered significant

    questions.forEach((question, index) => {
      const respondentScore = respondent.scores[index];
      const teamAverage = question.average;

      if (respondentScore !== null && Math.abs(respondentScore - teamAverage) >= outlierThreshold) {
        outlierQuestions.push({
          questionIndex: index,
          question: question.text,
          respondentScore,
          teamAverage,
          difference: Number((respondentScore - teamAverage).toFixed(2))
        });
      }
    });

    return {
      ...respondent,
      overallAverage,
      driverScores: respondentDriverScores,
      highestDriver: { name: highestDriver[0], score: highestDriver[1] },
      lowestDriver: { name: lowestDriver[0], score: lowestDriver[1] },
      outlierQuestions
    };
  });
}

/**
 * Main calculation function - performs all statistical calculations
 * @param {Object} parsedData - Output from excelParser
 * @returns {Object} Complete calculated data ready for Claude and PDF
 */
function calculateAll(parsedData) {
  const { respondents, questions } = parsedData;

  // Step 1: Calculate question statistics
  const questionsWithStats = calculateQuestionStats(questions);

  // Step 2: Calculate driver scores
  const driverScores = calculateDriverScores(questionsWithStats);

  // Step 3: Find strongest and weakest drivers
  const { strongest, weakest } = findExtremeDrivers(driverScores);

  // Step 4: Calculate respondent summaries
  const respondentSummaries = calculateRespondentSummaries(
    respondents,
    questionsWithStats,
    driverScores
  );

  // Step 5: Find key questions for insight
  const sortedByAverage = [...questionsWithStats].sort((a, b) => b.average - a.average);
  const sortedByStdDev = [...questionsWithStats].sort((a, b) => a.stdDev - b.stdDev);

  const highestQuestion = sortedByAverage[0];
  const lowestQuestion = sortedByAverage[sortedByAverage.length - 1];
  const mostAligned = sortedByStdDev[0]; // Lowest std dev = most agreement
  const mostDisagreed = sortedByStdDev[sortedByStdDev.length - 1]; // Highest std dev = most disagreement

  // Helper function to sort by driver order: Purpose, People, Plan, Product, Profit
  const driverOrder = ['Purpose', 'People', 'Plan', 'Product', 'Profit'];
  const sortByDriverOrder = (questions) => {
    return questions.sort((a, b) => {
      const aIndex = driverOrder.indexOf(a.driver);
      const bIndex = driverOrder.indexOf(b.driver);
      return aIndex - bIndex;
    });
  };

  return {
    questions: questionsWithStats,
    respondents: respondentSummaries,
    driverScores,
    strongestDriver: strongest,
    weakestDriver: weakest,
    highestQuestion,
    lowestQuestion,
    mostAligned,
    mostDisagreed,
    // All questions in Excel order for "Response Distribution" section
    allQuestionsInOrder: questionsWithStats,
    // Top 8 questions for each focused analysis section, sorted by driver order
    sortedByAlignment: sortByDriverOrder(sortedByStdDev.slice(0, 8)), // 8 questions with lowest std dev (most aligned)
    sortedByDifference: sortByDriverOrder([...questionsWithStats].sort((a, b) => b.stdDev - a.stdDev).slice(0, 8)), // 8 questions with highest std dev (most different)
    sortedByHighestScore: sortByDriverOrder(sortedByAverage.slice(0, 8)), // 8 questions with highest averages (biggest strengths)
    sortedByLowestScore: sortByDriverOrder([...sortedByAverage].reverse().slice(0, 8)) // 8 questions with lowest averages (biggest weaknesses)
  };
}

module.exports = {
  calculateAll,
  calculateAverage,
  calculateStdDev,
  calculateDistribution
};
