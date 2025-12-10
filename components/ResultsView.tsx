import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AssessmentResult, AssessmentType } from '../types';
import { calculateDifficulty } from '../utils/scoring';
import { generateAnalysis } from '../services/geminiService';
import { RefreshCw, Sparkles, BrainCircuit } from 'lucide-react-native';

interface Props {
  results: AssessmentResult[];
  onRestart: () => void;
}

const ResultsView: React.FC<Props> = ({ results, onRestart }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const averageScore = Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / Math.max(results.length, 1));
  const { classification, level } = calculateDifficulty(averageScore);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoadingAi(true);
      const text = await generateAnalysis(results);
      setAnalysis(text);
      setLoadingAi(false);
    };
    fetchAnalysis();
  }, [results]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: '#dcfce7', text: '#16a34a' };
    if (score >= 60) return { bg: '#fef9c3', text: '#ca8a04' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  const getFormattedRawMetric = (result: AssessmentResult) => {
    switch (result.type) {
      case AssessmentType.WordRecognition:
      case AssessmentType.VisualProcessing:
        return `${result.rawMetric} ms avg`;
      case AssessmentType.WorkingMemory:
        return `Span: ${result.rawMetric}`;
      default:
        return `${result.rawMetric}/${result.totalItems || '?'} Correct`;
    }
  };

  const scoreColorInfo = getScoreColor(averageScore);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.scoreRow}>
            <View>
                <Text style={styles.scoreValue}>{averageScore}</Text>
                <Text style={styles.scoreLabel}>Overall Score</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: scoreColorInfo.bg }]}>
                <Text style={[styles.badgeText, { color: scoreColorInfo.text }]}>{classification}</Text>
            </View>
        </View>
        <Text style={styles.summaryText}>
            Based on the assessment, your performance suggests <Text style={styles.bold}>{level}</Text> patterns consistent with <Text style={styles.bold}>{classification}</Text> dyslexia traits.
        </Text>
      </View>

      {/* AI Analysis */}
      <View style={styles.aiCard}>
        <Sparkles style={styles.sparkleIcon} size={24} color="rgba(255,255,255,0.3)" />
        <View style={styles.aiHeader}>
            <BrainCircuit size={20} color="white" />
            <Text style={styles.aiTitle}>AI Specialist Analysis</Text>
        </View>
        {loadingAi ? (
            <ActivityIndicator color="white" style={{ marginTop: 10 }} />
        ) : (
            <Text style={styles.aiText}>
               {analysis}
            </Text>
        )}
      </View>

      {/* Chart Replacement: Simple Bar List */}
      <View style={styles.chartCard}>
         <Text style={styles.cardTitle}>Performance Breakdown</Text>
         <View style={styles.chartContainer}>
            {results.map((r, i) => (
                <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>{r.type.replace(/([A-Z])/g, ' $1').trim()}</Text>
                    <View style={styles.barTrack}>
                        <View style={[
                            styles.barFill, 
                            { 
                                width: `${r.score}%`,
                                backgroundColor: r.score >= 80 ? '#4ade80' : r.score >= 60 ? '#facc15' : '#f87171' 
                            }
                        ]} />
                    </View>
                    <Text style={styles.barValue}>{r.score}</Text>
                </View>
            ))}
         </View>
      </View>

      {/* Detailed List */}
      <View style={styles.listContainer}>
        {results.map((res, idx) => (
            <View key={idx} style={styles.listItem}>
                <View>
                    <Text style={styles.itemTitle}>{res.type.replace(/([A-Z])/g, ' $1').trim()}</Text>
                    <Text style={styles.itemSubtitle}>
                        {getFormattedRawMetric(res)}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemScore}>{res.score}</Text>
                    <Text style={styles.itemScoreLabel}>Score</Text>
                </View>
            </View>
        ))}
      </View>

      <TouchableOpacity onPress={onRestart} style={styles.restartButton}>
         <RefreshCw size={20} color="white" style={{ marginRight: 8 }} />
         <Text style={styles.restartButtonText}>Start New Assessment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 40, padding: 24 },
  headerCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  scoreValue: { fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
  scoreLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontWeight: 'bold', fontSize: 14 },
  summaryText: { fontSize: 16, color: '#475569', lineHeight: 24 },
  bold: { fontWeight: 'bold' },
  
  aiCard: { backgroundColor: '#4f46e5', borderRadius: 24, padding: 24, marginBottom: 24, position: 'relative' },
  sparkleIcon: { position: 'absolute', top: 16, right: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  aiText: { color: '#e0e7ff', lineHeight: 22, fontSize: 14 },

  chartCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  chartContainer: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barLabel: { flex: 2, fontSize: 12, color: '#64748b', fontWeight: '500' },
  barTrack: { flex: 3, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 30, fontSize: 12, fontWeight: 'bold', color: '#334155', textAlign: 'right' },

  listContainer: { gap: 12, marginBottom: 32 },
  listItem: { backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#334155' },
  itemSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  itemScore: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  itemScoreLabel: { fontSize: 10, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' },

  restartButton: { backgroundColor: '#0f172a', width: '100%', paddingVertical: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  restartButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default ResultsView;
