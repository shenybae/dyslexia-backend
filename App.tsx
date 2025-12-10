import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { AssessmentResult } from './types';
import { ASSESSMENT_LIST } from './constants';
import AssessmentRunner from './components/AssessmentRunner';
import ResultsView from './components/ResultsView';
import { Brain, ArrowRight, X } from 'lucide-react-native';

export default function App() {
  const [view, setView] = useState<'welcome' | 'assessment' | 'results'>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<AssessmentResult[]>([]);

  const handleStartFlow = () => {
    setResults([]);
    setCurrentIndex(0);
    setView('assessment');
  };

  const handleAssessmentComplete = useCallback((result: AssessmentResult) => {
    // Critical fix: Use functional update to ensure we append to the LATEST results
    // preventing stale closure issues where results would be overwritten/lost.
    setResults(prevResults => [...prevResults, result]);

    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < ASSESSMENT_LIST.length) {
        return nextIndex;
      } else {
        setView('results');
        return prevIndex;
      }
    });
  }, []);

  const handleQuit = () => {
    Alert.alert(
      "Quit Assessment",
      "Are you sure you want to quit? Your current progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Quit", 
          style: "destructive", 
          onPress: () => {
            setView('welcome');
            setResults([]);
            setCurrentIndex(0);
          }
        }
      ]
    );
  };

  const currentConfig = ASSESSMENT_LIST[currentIndex];
  const progressPercent = ((currentIndex) / ASSESSMENT_LIST.length) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.iconContainer}>
             <Brain color="white" size={20} />
          </View>
          <Text style={styles.headerTitle}>DyslexiaScale</Text>
        </View>
        
        {view === 'assessment' && (
           <TouchableOpacity onPress={handleQuit} style={styles.closeButton}>
              <X size={24} color="#94a3b8" />
           </TouchableOpacity>
        )}
      </View>

      {view === 'assessment' && (
        <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      )}

      <View style={styles.mainContent}>
        {view === 'welcome' && (
          <ScrollView contentContainerStyle={styles.welcomeContainer}>
            <View style={styles.heroIcon}>
               <Brain size={48} color="#2563eb" />
            </View>
            
            <Text style={styles.welcomeTitle}>Comprehensive Assessment</Text>
            <Text style={styles.welcomeText}>
              This continuous evaluation consists of 8 distinct modules designed to analyze cognitive patterns associated with dyslexia.
            </Text>

            <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.infoText}>8 Standardized Tests</Text>
                </View>
                <View style={styles.infoItem}>
                     <View style={styles.bullet} />
                     <Text style={styles.infoText}>~5-10 Minutes Total</Text>
                </View>
                <View style={styles.infoItem}>
                     <View style={styles.bullet} />
                     <Text style={styles.infoText}>AI-Powered Analysis</Text>
                </View>
            </View>

            <TouchableOpacity 
              onPress={handleStartFlow}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start Assessment</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {view === 'assessment' && currentConfig && (
            <View style={styles.assessmentContainer}>
                 <Text style={styles.moduleIndicator}>
                    Module {currentIndex + 1} of {ASSESSMENT_LIST.length}
                 </Text>
                 
                <AssessmentRunner 
                    key={currentIndex} 
                    config={currentConfig}
                    onComplete={handleAssessmentComplete}
                    onCancel={handleQuit}
                />
            </View>
        )}

        {view === 'results' && (
            <ResultsView 
                results={results} 
                onRestart={() => setView('welcome')}
            />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // Safe Area fallback
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#2563eb',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  mainContent: {
    flex: 1,
  },
  welcomeContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#dbeafe',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  assessmentContainer: {
    flex: 1,
    padding: 24,
  },
  moduleIndicator: {
    position: 'absolute',
    top: 12,
    right: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 1,
    zIndex: 10,
  },
});