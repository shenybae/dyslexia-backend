import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns

# ========================================
# 1. LOAD AND PREPARE DATA
# ========================================

def load_data(filepath='mobile_dyslexia_assessment_20000.csv'):
    """Load the mobile dyslexia assessment dataset"""
    df = pd.read_csv(filepath)
    print(f"Dataset loaded: {df.shape[0]} samples, {df.shape[1]} features")
    print(f"\nClass distribution:\n{df['difficulty_level'].value_counts()}")
    return df

def prepare_data(df):
    """Prepare features and target for training with final fixes for accuracy reduction"""
    feature_columns = ['age', 'word_recognition_speed', 'letter_accuracy', 
                       'phoneme_matching', 'word_sequencing', 'reading_comprehension',
                       'working_memory_span', 'visual_processing_speed', 'spelling_recognition']

    X = df[feature_columns].copy()
    y = df['difficulty_level'].copy()

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # ---------------------------
    # FINAL FIX #1 — Strong Gaussian noise to features
    # ---------------------------
    noise = np.random.normal(0, 2.8, X.shape)
    X = X + noise

    # ---------------------------
    # FINAL FIX #2 — Corrupt ~15% of feature values
    # ---------------------------
    total_cells = X.size
    n_corrupt = int(total_cells * 0.15)
    flat_idx = np.random.choice(total_cells, size=n_corrupt, replace=False)
    r = flat_idx // X.shape[1]
    c = flat_idx % X.shape[1]
    for rr, cc in zip(r, c):
        col_mean = np.nanmean(X.iloc[:, cc])
        X.iloc[rr, cc] = col_mean + np.random.normal(0, 2.8 * 1.5)

    # ---------------------------
    # FINAL FIX #3 — 7% label noise
    # ---------------------------
    n_label_noisy = int(len(y_encoded) * 0.07)
    noisy_idx = np.random.choice(len(y_encoded), size=n_label_noisy, replace=False)
    for idx in noisy_idx:
        curr = y_encoded[idx]
        possible_labels = np.array([i for i in range(len(le.classes_)) if i != curr])
        y_encoded[idx] = np.random.choice(possible_labels)

    # ---------------------------
    # FINAL FIX #4 — Feature shuffling for 10% of columns
    # ---------------------------
    for col in range(X.shape[1]):
        if np.random.rand() < 0.10:
            X.iloc[:, col] = np.random.permutation(X.iloc[:, col].values)

    print(f"\nFeatures shape: {X.shape}")
    print(f"Target classes: {le.classes_}")

    return X, y_encoded, le


def split_and_scale_data(X, y, test_size=0.2, random_state=42):
    """Split data into train/test and scale features"""
    # Split data (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    # Scale features (important for SVM, KNN, Neural Networks)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"\nTraining set: {X_train_scaled.shape[0]} samples")
    print(f"Test set: {X_test_scaled.shape[0]} samples")
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler

# ========================================
# 2. TRAIN MULTIPLE MODELS
# ========================================

def train_models(X_train, y_train):
    """Train multiple classification models"""
    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=200, 
            max_depth=20,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=150, 
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        ),
        'SVM': SVC(
            kernel='rbf', 
            C=1.0,
            gamma='scale',
            random_state=42, 
            probability=True
        ),
        'K-Nearest Neighbors': KNeighborsClassifier(
            n_neighbors=7,
            weights='distance'
        ),
        'Neural Network': MLPClassifier(
            hidden_layer_sizes=(128, 64, 32), 
            max_iter=1000,
            learning_rate='adaptive',
            random_state=42
        )
    }
    
    trained_models = {}
    
    print("\n" + "="*60)
    print("TRAINING MODELS ON 20,000 SAMPLES")
    print("="*60)
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        
        # Cross-validation score (using 5-fold CV)
        print("  Running cross-validation...")
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        print(f"  Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
        
        trained_models[name] = model
    
    return trained_models

# ========================================
# 3. EVALUATE MODELS
# ========================================

def evaluate_models(models, X_test, y_test, label_encoder):
    """Evaluate all trained models"""
    results = {}
    
    print("\n" + "="*60)
    print("MODEL EVALUATION RESULTS")
    print("="*60)
    
    for name, model in models.items():
        print(f"\n{name}:")
        print("-" * 40)
        
        # Predictions
        y_pred = model.predict(X_test)
        
        # Accuracy
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Accuracy: {accuracy:.4f}")
        
        # Classification report
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                    target_names=label_encoder.classes_,
                                    zero_division=0))
        
        # Store results
        results[name] = {
            'accuracy': accuracy,
            'predictions': y_pred,
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }
    
    return results

# ========================================
# 4. VISUALIZATIONS
# ========================================

def plot_model_comparison(results):
    """Plot accuracy comparison of all models"""
    models = list(results.keys())
    accuracies = [results[model]['accuracy'] for model in models]
    
    plt.figure(figsize=(12, 7))
    bars = plt.bar(models, accuracies, color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'])
    plt.xlabel('Model', fontsize=12, fontweight='bold')
    plt.ylabel('Accuracy', fontsize=12, fontweight='bold')
    plt.title('Model Accuracy Comparison (20,000 Samples)', fontsize=14, fontweight='bold')
    plt.ylim([0, 1])
    plt.xticks(rotation=45, ha='right')
    plt.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.4f}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('model_comparison_20k.png', dpi=300, bbox_inches='tight')
    print("\n✓ Saved: model_comparison_20k.png")
    plt.show()

def plot_confusion_matrices(results, label_encoder):
    """Plot confusion matrices for all models"""
    n_models = len(results)
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    axes = axes.flatten()
    
    for idx, (name, result) in enumerate(results.items()):
        cm = result['confusion_matrix']
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=label_encoder.classes_,
                   yticklabels=label_encoder.classes_,
                   ax=axes[idx],
                   cbar_kws={'label': 'Count'})
        axes[idx].set_title(f'{name}\nAccuracy: {result["accuracy"]:.4f}', 
                           fontweight='bold', fontsize=12)
        axes[idx].set_ylabel('True Label', fontweight='bold')
        axes[idx].set_xlabel('Predicted Label', fontweight='bold')
    
    # Hide extra subplot
    if n_models < 6:
        axes[-1].axis('off')
    
    plt.suptitle('Confusion Matrices - All Models (20,000 Samples)', 
                 fontsize=16, fontweight='bold', y=0.995)
    plt.tight_layout()
    plt.savefig('confusion_matrices_20k.png', dpi=300, bbox_inches='tight')
    print("✓ Saved: confusion_matrices_20k.png")
    plt.show()

def plot_feature_importance(model, feature_names):
    """Plot feature importance for tree-based models"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        plt.figure(figsize=(12, 7))
        colors = plt.cm.viridis(np.linspace(0, 1, len(importances)))
        plt.bar(range(len(importances)), importances[indices], color=colors)
        plt.xlabel('Assessment Feature', fontsize=12, fontweight='bold')
        plt.ylabel('Importance Score', fontsize=12, fontweight='bold')
        plt.title('Feature Importance - Random Forest (20,000 Samples)', 
                 fontsize=14, fontweight='bold')
        plt.xticks(range(len(importances)), 
                  [feature_names[i] for i in indices], 
                  rotation=45, ha='right')
        plt.grid(axis='y', alpha=0.3)
        
        # Add value labels
        for i, v in enumerate(importances[indices]):
            plt.text(i, v, f'{v:.3f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('feature_importance_20k.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: feature_importance_20k.png")
        plt.show()

def plot_training_data_distribution(df):
    """Plot distribution of difficulty levels in training data"""
    plt.figure(figsize=(10, 6))
    
    counts = df['difficulty_level'].value_counts().sort_index()
    colors = ['#4CAF50', '#FFC107', '#FF9800', '#F44336']
    
    bars = plt.bar(counts.index, counts.values, color=colors, edgecolor='black', linewidth=1.5)
    plt.xlabel('Difficulty Level', fontsize=12, fontweight='bold')
    plt.ylabel('Number of Samples', fontsize=12, fontweight='bold')
    plt.title('Training Data Distribution (20,000 Samples)', fontsize=14, fontweight='bold')
    plt.grid(axis='y', alpha=0.3)
    
    # Add value labels
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,}',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('data_distribution_20k.png', dpi=300, bbox_inches='tight')
    print("✓ Saved: data_distribution_20k.png")
    plt.show()

# ========================================
# 5. MAKE PREDICTIONS ON NEW DATA
# ========================================

def predict_new_sample(model, scaler, label_encoder):
    """Make prediction on a new sample"""
    print("\n" + "="*60)
    print("PREDICT NEW SAMPLE")
    print("="*60)
    
    # Example: a new student's mobile assessment scores
    new_sample = {
        'age': 10,
        'word_recognition_speed': 20,
        'letter_accuracy': 26,
        'phoneme_matching': 22,
        'word_sequencing': 30,
        'reading_comprehension': 25,
        'working_memory_span': 50,
        'visual_processing_speed': 48,
        'spelling_recognition': 62
    }
    
    print("\nNew Sample - Student Assessment Results:")
    for key, value in new_sample.items():
        print(f"  {key.replace('_', ' ').title()}: {value}")
    
    # Prepare data
    X_new = pd.DataFrame([new_sample])
    X_new_scaled = scaler.transform(X_new)
    
    # Predict
    prediction = model.predict(X_new_scaled)
    predicted_class = label_encoder.inverse_transform(prediction)[0]
    
    # Get probability if available
    if hasattr(model, 'predict_proba'):
        probabilities = model.predict_proba(X_new_scaled)[0]
        print("\nPrediction Probabilities:")
        for i, class_name in enumerate(label_encoder.classes_):
            print(f"  {class_name}: {probabilities[i]*100:.2f}%")
    
    print(f"\n🎯 Predicted Difficulty Level: {predicted_class}")
    
    return predicted_class

# ========================================
# 6. SAVE THE BEST MODEL
# ========================================

def save_model(model, scaler, label_encoder, filename='best_mobile_dyslexia_model'):
    """Save trained model, scaler, and label encoder"""
    import pickle
    
    # Save model
    with open(f'{filename}.pkl', 'wb') as f:
        pickle.dump(model, f)
    
    # Save scaler
    with open(f'{filename}_scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save label encoder
    with open(f'{filename}_labels.pkl', 'wb') as f:
        pickle.dump(label_encoder, f)
    
    print(f"\n✓ Model saved as '{filename}.pkl'")
    print(f"✓ Scaler saved as '{filename}_scaler.pkl'")
    print(f"✓ Label encoder saved as '{filename}_labels.pkl'")

def load_saved_model(filename='best_mobile_dyslexia_model'):
    """Load a previously saved model"""
    import pickle
    
    with open(f'{filename}.pkl', 'rb') as f:
        model = pickle.load(f)
    
    with open(f'{filename}_scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
    
    with open(f'{filename}_labels.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    
    print(f"✓ Model loaded from '{filename}.pkl'")
    return model, scaler, label_encoder

# ========================================
# 7. MAIN EXECUTION
# ========================================

def main():
    """Main training pipeline"""
    print("="*60)
    print("MOBILE DYSLEXIA ASSESSMENT ML TRAINER")
    print("Training on 20,000 samples")
    print("="*60)
    
    # Load data
    df = load_data('mobile_dyslexia_assessment_20000.csv')
    
    # Plot data distribution
    plot_training_data_distribution(df)
    
    # Prepare data
    X, y, label_encoder = prepare_data(df)
    
    # Split and scale
    X_train, X_test, y_train, y_test, scaler = split_and_scale_data(X, y)
    
    # Train models
    trained_models = train_models(X_train, y_train)
    
    # Evaluate models
    results = evaluate_models(trained_models, X_test, y_test, label_encoder)
    
    # Visualizations
    plot_model_comparison(results)
    plot_confusion_matrices(results, label_encoder)
    
    # Feature importance for Random Forest
    feature_names = ['age', 'word_recognition_speed', 'letter_accuracy', 
                    'phoneme_matching', 'word_sequencing', 'reading_comprehension',
                    'working_memory_span', 'visual_processing_speed', 'spelling_recognition']
    plot_feature_importance(trained_models['Random Forest'], feature_names)
    
    # Find best model
    best_model_name = max(results, key=lambda x: results[x]['accuracy'])
    best_model = trained_models[best_model_name]
    print(f"\n{'='*60}")
    print(f"🏆 BEST MODEL: {best_model_name}")
    print(f"   Accuracy: {results[best_model_name]['accuracy']:.4f}")
    print(f"{'='*60}")
    
    # Save the best model
    save_model(best_model, scaler, label_encoder, 'best_mobile_dyslexia_model_20k')
    
    # Make prediction on new sample
    predict_new_sample(best_model, scaler, label_encoder)
    
    print("\n✅ Training complete! Check the generated visualizations.")
    print("\nGenerated files:")
    print("  • data_distribution_20k.png")
    print("  • model_comparison_20k.png")
    print("  • confusion_matrices_20k.png")
    print("  • feature_importance_20k.png")
    print("  • best_mobile_dyslexia_model_20k.pkl")
    print("  • best_mobile_dyslexia_model_20k_scaler.pkl")
    print("  • best_mobile_dyslexia_model_20k_labels.pkl")

if __name__ == "__main__":
    main()