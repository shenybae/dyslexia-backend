import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { AssessmentConfig, AssessmentResult, PerformanceMetrics, AssessmentType } from '../types';
import { Play, CheckCircle, XCircle, Volume2, Timer, RefreshCw } from 'lucide-react-native';
import * as Speech from 'expo-speech';

interface Props {
  config: AssessmentConfig;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

const AssessmentRunner: React.FC<Props> = ({ config, onComplete, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [sequenceInput, setSequenceInput] = useState<string[]>([]);
  
  // Working Memory Specific State
  const [memoryLevel, setMemoryLevel] = useState(2);
  const [memorySequence, setMemorySequence] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const [memoryFails, setMemoryFails] = useState(0);
  const [maxSpan, setMaxSpan] = useState(0);

  // Metrics
  const [startTime, setStartTime] = useState(0);
  const correctCount = useRef(0);
  const reactionTimes = useRef<number[]>([]);
  
  // Use a ref to prevent double firing of memory trials due to strict mode or re-renders
  const memoryTrialActive = useRef(false);

  const generateMemorySequence = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9 + 1).toString());
  };

  const startMemoryTrial = useCallback(() => {
    // If a trial is already setting up or running, ignore (unless we force reset logic, but for now linear flow)
    // Actually, we need to allow restarting.
    const seq = generateMemorySequence(memoryLevel);
    setMemorySequence(seq);
    setSequenceInput([]);
    setShowMemory(true);
    memoryTrialActive.current = true;
    
    // Hide after 2 seconds
    setTimeout(() => {
      setShowMemory(false);
      setStartTime(Date.now());
    }, 2000);
  }, [memoryLevel]);

  // Initial Start Trigger
  useEffect(() => {
    if (isStarted && config.type === AssessmentType.WorkingMemory && !memoryTrialActive.current) {
      startMemoryTrial();
    } else if (isStarted && config.type !== AssessmentType.WorkingMemory) {
      setStartTime(Date.now());
    }
  }, [isStarted, config.type, startMemoryTrial]);

  const handleStart = () => {
    setIsStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswer = (answer: string | string[]) => {
    const endTime = Date.now();
    const reactionTime = endTime - startTime;
    
    if (config.type === AssessmentType.WordSequencing) {
      return;
    }

    const currentQ = config.questions[currentIndex];
    let isCorrect = false;

    if (config.type === AssessmentType.WorkingMemory) {
       return; 
    } else {
      isCorrect = answer === currentQ.correctAnswer;
    }

    processResult(isCorrect, reactionTime);
  };

  const processResult = (isCorrect: boolean, reactionTime: number) => {
    if (isCorrect) correctCount.current += 1;
    reactionTimes.current.push(reactionTime);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      setSequenceInput([]);
      
      const nextIndex = currentIndex + 1;
      
      if (config.type !== AssessmentType.WorkingMemory && nextIndex >= config.questions.length) {
        finishAssessment();
      } else {
        setCurrentIndex(nextIndex);
        setStartTime(Date.now());
      }
    }, 500); 
  };

  const handleMemorySubmit = (input: string[]) => {
    const reactionTime = Date.now() - startTime;
    const isCorrect = input.join('') === memorySequence.join('');
    
    reactionTimes.current.push(reactionTime);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    memoryTrialActive.current = false; // Reset lock

    setTimeout(() => {
        setFeedback(null);
        if (isCorrect) {
            correctCount.current += 1;
            const newSpan = Math.max(maxSpan, memoryLevel);
            setMaxSpan(newSpan);
            
            // Cap at 9 digits to ensure completion
            if (memoryLevel >= 9) {
                finishAssessment();
            } else {
                setMemoryLevel(prev => prev + 1);
                setMemoryFails(0); 
                // We rely on the useEffect dependency on 'memoryLevel' to trigger next trial? 
                // OR we call it here. Calling it here is safer for flow control.
                // But we must avoid useEffect duplicate.
                // We'll use a timeout to let state settle then call trial.
                setTimeout(() => startMemoryTrial(), 100);
            }
        } else {
            const newFails = memoryFails + 1;
            setMemoryFails(newFails);
            if (newFails >= 2) {
                finishAssessment();
            } else {
                setTimeout(() => startMemoryTrial(), 100);
            }
        }
    }, 1000);
  };

  const finishAssessment = () => {
    const totalReactionTime = reactionTimes.current.reduce((a, b) => a + b, 0);
    const avgTime = totalReactionTime / reactionTimes.current.length || 0;
    const totalTrials = config.type === AssessmentType.WorkingMemory ? reactionTimes.current.length : config.questions.length;

    const metrics: PerformanceMetrics = {
      totalTrials,
      correctAnswers: correctCount.current,
      averageReactionTime: avgTime,
      maxSpan: maxSpan
    };

    const score = config.calculateScore(metrics);

    let rawMetric = 0;
    if ([AssessmentType.WordRecognition, AssessmentType.VisualProcessing].includes(config.type)) {
       rawMetric = Math.round(avgTime);
    } else if (config.type === AssessmentType.WorkingMemory) {
       rawMetric = maxSpan;
    } else {
       rawMetric = correctCount.current;
    }

    onComplete({
      type: config.type,
      score,
      rawMetric,
      totalItems: totalTrials,
      completed: true,
      date: new Date().toISOString()
    });
  };

  const playAudio = (text: string) => {
    Speech.speak(text, { rate: 0.8 });
  };

  if (!isStarted) {
    return (
      <View style={styles.startContainer}>
        <View style={styles.startIconContainer}>
          <Play size={32} color="#2563eb" fill="#2563eb" />
        </View>
        <Text style={styles.startTitle}>{config.title}</Text>
        <Text style={styles.startDescription}>{config.description}</Text>
        <TouchableOpacity onPress={handleStart} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start Section</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
           <Text style={styles.cancelLink}>Quit Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- RENDERERS ----

  // 1. Memory Game
  if (config.type === AssessmentType.WorkingMemory) {
    return (
        <View style={styles.gameContainer}>
            <Text style={styles.subHeader}>Level {memoryLevel - 1}</Text>
            
            <View style={styles.memoryDisplay}>
                {showMemory ? (
                    <Text 
                        style={styles.memoryText} 
                        adjustsFontSizeToFit 
                        numberOfLines={1}
                    >
                        {memorySequence.join('  ')}
                    </Text>
                ) : feedback ? (
                   <View>
                        {feedback === 'correct' ? <CheckCircle size={80} color="#22c55e"/> : <XCircle size={80} color="#ef4444" />}
                   </View>
                ) : (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <View style={styles.sequenceDisplay}>
                            <Text style={styles.sequenceDisplayText} adjustsFontSizeToFit numberOfLines={1}>
                                {sequenceInput.join(' ') || "Enter numbers"}
                            </Text>
                        </View>
                        <View style={styles.numpad}>
                            {[1,2,3,4,5,6,7,8,9].map(n => (
                                <TouchableOpacity 
                                    key={n}
                                    onPress={() => setSequenceInput(prev => [...prev, n.toString()])}
                                    style={styles.numButton}
                                >
                                    <Text style={styles.numButtonText}>{n}</Text>
                                </TouchableOpacity>
                            ))}
                            <View />
                            <TouchableOpacity onPress={() => handleMemorySubmit(sequenceInput)} style={[styles.numButton, styles.okButton]}>
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSequenceInput([])} style={[styles.numButton, styles.resetButton]}>
                                <RefreshCw color="#475569" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
  }

  const currentQ = config.questions[currentIndex];

  // 2. Sequence Game
  if (config.type === AssessmentType.WordSequencing) {
    const handleSeqTap = (letter: string, index: number) => {
        if (feedback) return;
        
        const newSeq = [...sequenceInput, letter];
        setSequenceInput(newSeq);

        const target = currentQ.correctAnswer as string[];
        
        if (newSeq.length === target.length) {
            const isCorrect = newSeq.join('') === target.join('');
            const time = Date.now() - startTime;
            processResult(isCorrect, time);
        }
    };

    return (
        <View style={styles.gameContainer}>
             <Text style={styles.stimulusText}>Spell the word:</Text>
             
             <View style={styles.seqTargetContainer}>
                {(currentQ.correctAnswer as string[]).map((_, i) => (
                    <View key={i} style={styles.seqSlot}>
                        <Text style={styles.seqSlotText}>{sequenceInput[i] || ''}</Text>
                    </View>
                ))}
             </View>

             {feedback && (
                 <View style={styles.feedbackOverlay}>
                     {feedback === 'correct' ? <CheckCircle size={100} color="#22c55e" /> : <XCircle size={100} color="#ef4444" />}
                 </View>
             )}

             <View style={styles.seqOptionsContainer}>
                {currentQ.options?.map((opt, i) => {
                    const disabled = sequenceInput.filter(l => l === opt).length >= currentQ.options!.filter(l => l === opt).length;
                    return (
                        <TouchableOpacity
                            key={`${opt}-${i}`}
                            disabled={disabled}
                            onPress={() => handleSeqTap(opt, i)}
                            style={[styles.seqOptionButton, disabled && styles.seqOptionDisabled]}
                        >
                            <Text style={styles.seqOptionText}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
             </View>
             
             <TouchableOpacity onPress={() => setSequenceInput([])} style={styles.resetTextBtn}>
                 <RefreshCw size={16} color="#94a3b8"/>
                 <Text style={{color: '#94a3b8', marginLeft: 8}}>Reset</Text>
             </TouchableOpacity>
        </View>
    );
  }

  // 3. Audio/Phoneme Matching
  if (config.type === AssessmentType.PhonemeMatching) {
      return (
        <View style={styles.gameContainer}>
            <Text style={styles.stimulusText}>{currentQ.stimulus}</Text>
            
            <TouchableOpacity 
                onPress={() => playAudio(currentQ.audioText || '')}
                style={styles.audioButton}
            >
                <Volume2 size={48} color="#2563eb" />
            </TouchableOpacity>

            <View style={styles.gridContainer}>
                {currentQ.options?.map((opt, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => handleAnswer(opt)}
                        style={[
                            styles.optionButton,
                            feedback && opt === currentQ.correctAnswer && styles.optionCorrect,
                            feedback && opt !== currentQ.correctAnswer && styles.optionDim
                        ]}
                    >
                        <Text style={[
                            styles.optionText,
                            feedback && opt === currentQ.correctAnswer && styles.optionTextCorrect
                        ]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
      )
  }

  // 4. Standard Selection
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
         <Text style={styles.questionCounter}>Question {currentIndex + 1}/{config.questions.length}</Text>
         <Timer size={20} color="#cbd5e1" />
      </View>

      <View style={styles.stimulusContainer}>
        {currentQ.distractors && (
             <View style={styles.passageCard}>
                 <Text style={styles.passageText}>{currentQ.stimulus}</Text>
             </View>
        )}
        
        {config.type === AssessmentType.ReadingComprehension ? (
            <Text style={styles.questionText}>{currentQ.distractors?.[0]}</Text>
        ) : (
            <Text 
                adjustsFontSizeToFit 
                numberOfLines={1}
                style={[
                    styles.mainStimulus,
                    config.type === AssessmentType.VisualProcessing && { fontSize: 80 },
                    config.type === AssessmentType.WordRecognition && { fontSize: 32 } 
                ]}
            >
                {config.type !== AssessmentType.WordRecognition && currentQ.stimulus} 
                {config.type === AssessmentType.WordRecognition && "Find: " + currentQ.correctAnswer}
            </Text>
        )}
      </View>

      <View style={styles.gridContainer}>
        {currentQ.options?.map((opt, idx) => {
            const showCorrect = feedback && opt === currentQ.correctAnswer;
            const showError = feedback === 'wrong' && !showCorrect;

            return (
                <TouchableOpacity
                    key={idx}
                    disabled={!!feedback}
                    onPress={() => handleAnswer(opt)}
                    style={[
                        styles.optionButton,
                        showCorrect && styles.optionCorrect,
                        showError && styles.optionDim
                    ]}
                >
                    <Text style={[
                        styles.optionText,
                        showCorrect && styles.optionTextCorrect
                    ]}>{opt}</Text>
                </TouchableOpacity>
            )
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  startContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  startIconContainer: { width: 64, height: 64, backgroundColor: '#dbeafe', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  startTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  startDescription: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  primaryButton: { backgroundColor: '#2563eb', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelLink: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  
  gameContainer: { flex: 1, alignItems: 'center', paddingTop: 32 },
  subHeader: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32 },
  memoryDisplay: { flex: 1, width: '100%', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  memoryText: { fontSize: 56, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', letterSpacing: 8 },
  
  sequenceDisplay: { width: '100%', height: 80, backgroundColor: '#f1f5f9', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 2, borderColor: '#e2e8f0', paddingHorizontal: 16 },
  sequenceDisplayText: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  numButton: { width: 80, height: 80, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#e2e8f0' },
  numButtonText: { fontSize: 24, fontWeight: 'bold', color: '#334155' },
  okButton: { backgroundColor: '#3b82f6', borderBottomColor: '#1d4ed8' },
  okButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  resetButton: { backgroundColor: '#e2e8f0', borderBottomColor: '#cbd5e1' },

  stimulusText: { fontSize: 20, fontWeight: '500', color: '#475569', marginBottom: 32 },
  seqTargetContainer: { flexDirection: 'row', gap: 8, marginBottom: 48, height: 64 },
  seqSlot: { width: 48, height: 56, borderBottomWidth: 4, borderBottomColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  seqSlotText: { fontSize: 32, fontWeight: 'bold', color: '#2563eb' },
  seqOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  seqOptionButton: { width: 64, height: 64, backgroundColor: 'white', borderRadius: 12, borderBottomWidth: 4, borderBottomColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  seqOptionDisabled: { opacity: 0.3 },
  seqOptionText: { fontSize: 24, fontWeight: 'bold', color: '#334155' },
  resetTextBtn: { marginTop: 48, flexDirection: 'row', alignItems: 'center' },
  feedbackOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 20 },

  audioButton: { width: 128, height: 128, borderRadius: 64, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  questionCounter: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' },
  stimulusContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 32, width: '100%', paddingHorizontal: 16 },
  passageCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
  passageText: { fontSize: 18, color: '#475569', lineHeight: 28, textAlign: 'center' },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  mainStimulus: { fontSize: 40, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  optionButton: { width: (width - 64) / 2, paddingVertical: 24, backgroundColor: 'white', borderRadius: 16, borderBottomWidth: 4, borderBottomColor: '#e2e8f0', alignItems: 'center' },
  optionText: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  optionCorrect: { backgroundColor: '#22c55e', borderBottomColor: '#15803d' },
  optionTextCorrect: { color: 'white' },
  optionDim: { opacity: 0.4 },
});

export default AssessmentRunner;