import { AssessmentConfig, AssessmentType, Question } from './types';
import { 
  scoreWordRecognition, 
  scoreAccuracy, 
  scoreWordSequencing, 
  scoreWorkingMemory, 
  scoreVisualProcessing 
} from './utils/scoring';

// Helper to shuffle arrays
const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- DATA GENERATORS ---

// Assessment 1: Word Recognition
const generateWordRecogQuestions = (): Question[] => {
  const baseWords = [
    { correct: "laugh", options: ["laugh", "laguh", "luagh", "lahgu"] },
    { correct: "enough", options: ["enough", "enouhg", "enuogh", "engouh"] },
    { correct: "people", options: ["people", "poeple", "peolpe", "peopel"] },
    { correct: "beautiful", options: ["beautiful", "beutiful", "bueatiful", "beautifull"] },
    { correct: "thorough", options: ["thorough", "through", "thorogh", "thourgh"] },
    { correct: "although", options: ["although", "allthough", "altho", "although"] },
    { correct: "thought", options: ["thought", "thougth", "thot", "thouhgt"] },
    { correct: "through", options: ["through", "throuhg", "thruogh", "throgh"] },
    { correct: "writing", options: ["writing", "writting", "wriiting", "wirting"] },
    { correct: "beginning", options: ["beginning", "begining", "beggining", "beginnig"] },
    { correct: "different", options: ["different", "diffrent", "diferent", "differnt"] },
    { correct: "definitely", options: ["definitely", "definately", "definatly", "definetly"] },
    { correct: "usually", options: ["usually", "usally", "usualy", "usuallly"] },
    { correct: "restaurant", options: ["restaurant", "resturant", "restaraunt", "restuarant"] },
    { correct: "mountain", options: ["mountain", "mountian", "mountan", "mounatin"] },
    { correct: "ocean", options: ["ocean", "oscean", "ocian", "ocean"] },
    { correct: "camera", options: ["camera", "camra", "camerra", "cemara"] },
    { correct: "animal", options: ["animal", "aminal", "animol", "animel"] },
    { correct: "letter", options: ["letter", "leter", "lettre", "lettur"] },
    { correct: "number", options: ["number", "numer", "numbre", "numbor"] },
  ];
  return baseWords.map((w, i) => ({
    id: `wr-${i}`,
    stimulus: "Identify:",
    type: 'selection',
    correctAnswer: w.correct,
    options: shuffle(w.options)
  }));
};

// Assessment 2: Letter Accuracy
const generateLetterQuestions = (): Question[] => {
  const targets = ['b', 'd', 'p', 'q', 'm', 'n', 'u', 'w'];
  let bag: string[] = [];
  targets.forEach(t => {
     bag.push(t, t, t, t);
  });
  bag = shuffle(bag).slice(0, 30);

  const questions: Question[] = [];
  
  for (let i = 0; i < 30; i++) {
    const target = bag[i];
    let options = [];
    if (['b', 'd', 'p', 'q'].includes(target)) options = ['b', 'd', 'p', 'q'];
    else if (['m', 'n', 'u', 'w'].includes(target)) options = ['m', 'n', 'u', 'w'];
    else options = [target, 'o', 'c', 'e'];

    questions.push({
      id: `la-${i}`,
      stimulus: target,
      type: 'selection',
      correctAnswer: target,
      options: shuffle(options)
    });
  }
  return questions;
};

// Assessment 3: Phoneme Matching
const generatePhonemeQuestions = (): Question[] => {
  const data = [
    { sound: 'sh', options: ['sh', 'ch', 's', 'th'] },
    { sound: 'ch', options: ['ch', 'sh', 'tc', 'k'] },
    { sound: 'th', options: ['th', 'f', 'v', 'd'] },
    { sound: 'b', options: ['b', 'd', 'p', 'g'] },
    { sound: 'd', options: ['d', 'b', 't', 'p'] },
    { sound: 'k', options: ['k', 'g', 'c', 't'] },
    { sound: 'p', options: ['p', 'b', 'q', 'd'] },
    { sound: 'a', options: ['a', 'e', 'o', 'u'] },
    { sound: 'e', options: ['e', 'i', 'a', 'y'] },
    { sound: 'i', options: ['i', 'e', 'y', 'l'] },
    { sound: 'o', options: ['o', 'a', 'u', 'e'] },
    { sound: 'u', options: ['u', 'n', 'v', 'w'] },
    { sound: 'm', options: ['m', 'n', 'w', 'h'] },
    { sound: 'n', options: ['n', 'm', 'u', 'h'] },
    { sound: 'f', options: ['f', 'th', 'v', 'ph'] },
    { sound: 'br', options: ['br', 'dr', 'pr', 'gr'] },
    { sound: 'st', options: ['st', 'sp', 'sl', 'ts'] },
    { sound: 'pl', options: ['pl', 'bl', 'cl', 'fl'] },
    { sound: 'gr', options: ['gr', 'gl', 'br', 'cr'] },
    { sound: 'sl', options: ['sl', 'st', 'cl', 'fl'] },
  ];
  return data.map((d, i) => ({
    id: `pm-${i}`,
    stimulus: `Tap the sound for /${d.sound}/`,
    audioText: d.sound,
    type: 'audio_match',
    correctAnswer: d.sound,
    options: shuffle(d.options)
  }));
};

// Assessment 4: Word Sequencing (Expanded to ensure uniqueness from Word Recog)
const generateSequenceQuestions = (): Question[] => {
  const words = [
    'sky', 'fox', 'joy',
    'frog', 'lamp', 'nest',
    'plant', 'drink', 'storm',
    'garden', 'purple', 'winter',
    'monkey', 'doctor', 'yellow'
  ];
  
  return words.map((word, i) => {
    const chars = word.split('');
    const scrambled = shuffle([...chars]);
    if (scrambled.join('') === word && word.length > 1) {
        [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
    }
    
    return {
      id: `ws-${i}`,
      stimulus: word, 
      type: 'sequence',
      correctAnswer: chars,
      options: scrambled
    };
  });
};

// Assessment 7: Visual Processing
const generateVisualQuestions = (): Question[] => {
  const symbols = ['⭐', '★', '✦', '✧', '✨', '☀', '✸', '✶'];
  let bag: string[] = [];
  symbols.forEach(s => bag.push(s, s, s));
  bag.push(symbols[Math.floor(Math.random() * symbols.length)]);
  bag = shuffle(bag);

  return bag.map((target, i) => {
    const options = [target];
    while (options.length < 5) {
      const s = symbols[Math.floor(Math.random() * symbols.length)];
      if (!options.includes(s)) options.push(s);
    }
    return {
      id: `vp-${i}`,
      stimulus: target,
      type: 'visual_search',
      correctAnswer: target,
      options: shuffle(options)
    };
  });
};

// Assessment 8: Spelling Recognition (New distinct set)
const generateSpellingQuestions = (): Question[] => {
  const pairs = [
    { correct: "calendar", wrong: "calender" },
    { correct: "library", wrong: "libary" },
    { correct: "grammar", wrong: "grammer" },
    { correct: "minute", wrong: "minite" },
    { correct: "weird", wrong: "wierd" },
    { correct: "across", wrong: "accross" },
    { correct: "appearance", wrong: "appearence" },
    { correct: "argument", wrong: "arguement" },
    { correct: "basically", wrong: "basicly" },
    { correct: "completely", wrong: "completly" },
    { correct: "disappear", wrong: "dissapear" },
    { correct: "finally", wrong: "finaly" },
    { correct: "foreign", wrong: "foriegn" },
    { correct: "forty", wrong: "fourty" },
    { correct: "forward", wrong: "foward" },
    { correct: "happen", wrong: "hapen" },
    { correct: "independent", wrong: "independant" },
    { correct: "interest", wrong: "intrest" },
    { correct: "little", wrong: "litfle" },
    { correct: "really", wrong: "realy" },
  ];
  return pairs.map((p, i) => ({
    id: `sr-${i}`,
    stimulus: "Which is correct?",
    type: 'selection',
    correctAnswer: p.correct,
    options: shuffle([p.correct, p.wrong])
  }));
};

export const ASSESSMENTS_DATA: Record<AssessmentType, AssessmentConfig> = {
  [AssessmentType.WordRecognition]: {
    type: AssessmentType.WordRecognition,
    title: "Word Recognition Speed",
    description: "Measures the time taken to identify correct words.",
    instructions: "Tap the correct word as fast as possible (20 trials).",
    calculateScore: scoreWordRecognition,
    questions: generateWordRecogQuestions()
  },
  [AssessmentType.LetterAccuracy]: {
    type: AssessmentType.LetterAccuracy,
    title: "Letter Accuracy",
    description: "Measures ability to correctly identify letters, specifically b/d/p/q.",
    instructions: "Tap the letter that matches the target shown (30 trials).",
    calculateScore: scoreAccuracy,
    questions: generateLetterQuestions()
  },
  [AssessmentType.PhonemeMatching]: {
    type: AssessmentType.PhonemeMatching,
    title: "Phoneme Matching",
    description: "Measures ability to connect spoken sounds with letters.",
    instructions: "Listen to the sound and tap the matching letters (20 trials).",
    calculateScore: scoreAccuracy,
    questions: generatePhonemeQuestions()
  },
  [AssessmentType.WordSequencing]: {
    type: AssessmentType.WordSequencing,
    title: "Word Sequencing",
    description: "Measures ability to arrange jumbled letters into words.",
    instructions: "Tap letters in order to spell the word (15 trials).",
    calculateScore: scoreWordSequencing,
    questions: generateSequenceQuestions()
  },
  [AssessmentType.ReadingComprehension]: {
    type: AssessmentType.ReadingComprehension,
    title: "Reading Comprehension",
    description: "Measures understanding of written text.",
    instructions: "Read the passage and answer 5 questions.",
    calculateScore: scoreAccuracy,
    questions: [
      { 
        id: 'rc-1', 
        stimulus: "The brown dog ran through the park. It chased a red ball. The dog was very happy.", 
        type: 'selection', 
        correctAnswer: 'Brown', 
        options: shuffle(['Black', 'Brown', 'White', 'Spotted']),
        distractors: ["What color was the dog?"]
      },
      { 
        id: 'rc-2', 
        stimulus: "The brown dog ran through the park. It chased a red ball. The dog was very happy.", 
        type: 'selection', 
        correctAnswer: 'Park', 
        options: shuffle(['Street', 'House', 'Park', 'Beach']),
        distractors: ["Where did the dog run?"]
      },
      { 
        id: 'rc-3', 
        stimulus: "The brown dog ran through the park. It chased a red ball. The dog was very happy.", 
        type: 'selection', 
        correctAnswer: 'Red ball', 
        options: shuffle(['Red ball', 'Blue car', 'Green stick', 'Yellow bird']),
        distractors: ["What did the dog chase?"]
      },
      { 
        id: 'rc-4', 
        stimulus: "The brown dog ran through the park. It chased a red ball. The dog was very happy.", 
        type: 'selection', 
        correctAnswer: 'Happy', 
        options: shuffle(['Sad', 'Angry', 'Happy', 'Tired']),
        distractors: ["How did the dog feel?"]
      },
      { 
        id: 'rc-5', 
        stimulus: "The brown dog ran through the park. It chased a red ball. The dog was very happy.", 
        type: 'selection', 
        correctAnswer: 'Ran after', 
        options: shuffle(['Ate', 'Ran after', 'Slept on', 'Bit']),
        distractors: ["What does 'chased' mean?"]
      },
    ]
  },
  [AssessmentType.WorkingMemory]: {
    type: AssessmentType.WorkingMemory,
    title: "Working Memory Span",
    description: "Measures capacity to hold sequences of numbers.",
    instructions: "Memorize the numbers, then type them in order.",
    calculateScore: scoreWorkingMemory,
    questions: []
  },
  [AssessmentType.VisualProcessing]: {
    type: AssessmentType.VisualProcessing,
    title: "Visual Processing Speed",
    description: "Measures speed of matching visual symbols.",
    instructions: "Match the symbol as fast as possible (25 trials).",
    calculateScore: scoreVisualProcessing,
    questions: generateVisualQuestions()
  },
  [AssessmentType.SpellingRecognition]: {
    type: AssessmentType.SpellingRecognition,
    title: "Spelling Recognition",
    description: "Measures ability to identify correctly spelled words.",
    instructions: "Tap the correctly spelled word (20 trials).",
    calculateScore: scoreAccuracy,
    questions: generateSpellingQuestions()
  }
};

export const ASSESSMENT_LIST = [
  ASSESSMENTS_DATA[AssessmentType.WordRecognition],
  ASSESSMENTS_DATA[AssessmentType.LetterAccuracy],
  ASSESSMENTS_DATA[AssessmentType.PhonemeMatching],
  ASSESSMENTS_DATA[AssessmentType.WordSequencing],
  ASSESSMENTS_DATA[AssessmentType.ReadingComprehension],
  ASSESSMENTS_DATA[AssessmentType.WorkingMemory],
  ASSESSMENTS_DATA[AssessmentType.VisualProcessing],
  ASSESSMENTS_DATA[AssessmentType.SpellingRecognition],
];
