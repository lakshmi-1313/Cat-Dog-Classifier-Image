# 🐾 Cat vs. Dog Image Classifier (MobileNetV2 + ONNX Web App)

An end-to-end supervised binary image classification project that progresses from classical machine learning baselines and custom CNNs to **MobileNetV2 transfer learning**, exported to **ONNX** for fast, client-side browser inference.

---

## ✨ Key Highlights

* **95.67% Test Accuracy** and **0.9872 ROC-AUC** on 300 unseen test images (150 Cats, 150 Dogs).
* **Leak-Free Data Pipeline:** Audited 24,998 Kaggle images, removed 30 exact byte-level duplicates via **SHA-1 hashing**, standardized mixed color modes (`RGB`, `RGBA`, `CMYK`, `L`, `P`) with **Pillow**, and created a stratified **70 / 15 / 15** split (`random_state = 42`).
* **Systematic Model Progression:** Benchmarked classical ML on flattened pixels, **HOG** and **PCA** feature engineering, custom CNNs with data augmentation, and frozen **MobileNetV2** transfer learning.
* **Client-Side Web App:** Deployed as a responsive web application using **ONNX Runtime Web** (`final_cat_dog_model.onnx`), running `96×96×3` preprocessing and inference directly in the browser with sub-40ms latency, uncertainty thresholds, and out-of-distribution non-pet detection (`COCO-SSD`).

---

## 📊 Model Progression & Results

All candidate models were evaluated on the **Validation Set (300 images)** before selecting the best model for a single evaluation on the **Held-Out Test Set (300 images)**:

| Stage | Model / Approach | Input Representation | Validation Accuracy | Validation ROC-AUC |
| :--- | :--- | :--- | :---: | :---: |
| **Classical ML** | Linear SVM | `32×32` Flattened RGB | 51.7% | 0.530 |
| **Classical ML** | Logistic Regression | `32×32` Flattened RGB | 53.3% | 0.539 |
| **Classical ML** | Random Forest (80 trees) | `32×32` Flattened RGB | 56.7% | 0.607 |
| **Classical ML** | KNN (`k = 5`, standardized) | `32×32` Flattened RGB | 60.3% | 0.627 |
| **Feature Eng.** | PCA (102 comps, 90.05% var) + LogReg | `32×32` Compressed RGB | 56.0% | — |
| **Feature Eng.** | HOG (`8×8` cells) + Linear SVM | `64×64` Grayscale Edges | 61.3% | 0.673 |
| **Deep Learning** | Custom CNN + Augmentation | `64×64×3` RGB | ~58.3% | 0.613 |
| **Transfer Learning** | **Frozen MobileNetV2 + Custom Head** | **`96×96×3` RGB** | **94.3%** | **0.984** |

### 🏆 Final Held-Out Test Set Performance (MobileNetV2)
* **Test Accuracy:** `95.67%` (287 / 300 correct)
* **Precision:** `94.19%`
* **Recall:** `97.33%`
* **F1-Score:** `95.74%`
* **ROC-AUC:** `0.9872`

---

## 🏗️ Project Architecture

```text
├── public/
│   └── final_cat_dog_model.onnx     # Exported MobileNetV2 ONNX model (auto-loaded)
├── src/                             # React + TypeScript frontend & ONNX inference logic
├── app/
│   └── app.py                       # Streamlit prototype application
├── notebooks/                       # Google Colab training, evaluation & ONNX export notebook
├── package.json
└── README.md
