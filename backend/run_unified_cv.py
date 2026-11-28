import os
import sys
import json
import time
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from sklearn.model_selection import StratifiedKFold

DATASET_ROOT = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/source/Rice_and_Maize_Dataset"
PADDY_DATASET = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/source/paddy-disease-classification/train_images"
OUTPUT_DIR = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/models/trained_models_cv"
os.makedirs(OUTPUT_DIR, exist_ok=True)

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Accelerated training running on: {device}")

class ImageFlatDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = Image.open(path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label

train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def train_and_eval_cv(name, samples, class_names, n_splits=5, epochs=15, batch_size=32, patience=2):
    print(f"\n=======================================================")
    print(f"  {name.upper()}: {n_splits}-FOLD CROSS-VALIDATION ({len(samples)} imgs, {len(class_names)} classes)")
    print(f"=======================================================")
    
    labels = [s[1] for s in samples]
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    fold_accuracies = []
    best_overall_acc = 0.0
    best_model_path = os.path.join(OUTPUT_DIR, f"{name.lower().replace(' ', '_')}_best_cv.pt")
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(samples, labels)):
        train_samples = [samples[i] for i in train_idx]
        val_samples = [samples[i] for i in val_idx]
        
        train_loader = DataLoader(ImageFlatDataset(train_samples, train_transform), batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(ImageFlatDataset(val_samples, val_transform), batch_size=batch_size, shuffle=False)
        
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        # Freeze early layers for rapid convergence
        for p in model.features[:12].parameters():
            p.requires_grad = False
            
        in_f = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(nn.Dropout(0.2), nn.Linear(in_f, len(class_names)))
        model = model.to(device)
        
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3)
        best_val_acc = 0.0
        epochs_without_improvement = 0
        
        for epoch in range(1, epochs + 1):
            model.train()
            correct, total = 0, 0
            for imgs, lbls in train_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                optimizer.zero_grad()
                out = model(imgs)
                loss = criterion(out, lbls)
                loss.backward()
                optimizer.step()
                _, p = torch.max(out, 1)
                correct += (p == lbls).sum().item()
                total += lbls.size(0)
            train_acc = correct / total
            
            # Val
            model.eval()
            v_correct, v_total = 0, 0
            with torch.no_grad():
                for imgs, lbls in val_loader:
                    imgs, lbls = imgs.to(device), lbls.to(device)
                    out = model(imgs)
                    _, p = torch.max(out, 1)
                    v_correct += (p == lbls).sum().item()
                    v_total += lbls.size(0)
            v_acc = v_correct / v_total
            print(f"Fold {fold+1} Epoch {epoch:02d} | Train Acc: {train_acc*100:.1f}% | Val Acc: {v_acc*100:.2f}%")
            if v_acc > best_val_acc:
                best_val_acc = v_acc
                epochs_without_improvement = 0
                if v_acc > best_overall_acc:
                    best_overall_acc = v_acc
                    torch.save({'state_dict': model.state_dict(), 'classes': class_names, 'val_acc': v_acc}, best_model_path)
            else:
                epochs_without_improvement += 1
                if epochs_without_improvement >= patience:
                    print(f"--> Early stopping Fold {fold+1} at Epoch {epoch:02d} (no val accuracy improvement for {patience} epochs)")
                    break
                    
        fold_accuracies.append(best_val_acc)
        print(f"--> Fold {fold+1} Best Val Acc: {best_val_acc*100:.2f}%")
        
    mean_acc = float(np.mean(fold_accuracies))
    std_acc = float(np.std(fold_accuracies))
    print(f">> {name} 5-Fold Mean Accuracy: {mean_acc*100:.2f}% (+/- {std_acc*100:.2f}%)")
    
    report = {
        "dataset": name,
        "n_splits": n_splits,
        "classes": class_names,
        "fold_accuracies": [round(float(a), 4) for a in fold_accuracies],
        "mean_accuracy": round(mean_acc, 4),
        "std_accuracy": round(std_acc, 4),
        "best_overall_accuracy": round(float(best_overall_acc), 4),
        "model_path": best_model_path
    }
    with open(os.path.join(OUTPUT_DIR, f"{name.lower().replace(' ', '_')}_cv_report.json"), "w") as fp:
        json.dump(report, fp, indent=2)
    return report

def collect_crop_samples(crop_name):
    crop_dir = os.path.join(DATASET_ROOT, crop_name)
    samples = []
    class_names = []
    for root, dirs, files in os.walk(crop_dir):
        img_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if img_files:
            clean_name = os.path.basename(root)
            if clean_name[:2].isdigit() and clean_name[2] == '_':
                clean_name = clean_name[3:]
            label = clean_name.replace('_', ' ').title()
            if label not in class_names:
                class_names.append(label)
            idx = class_names.index(label)
            for f in img_files:
                samples.append((os.path.join(root, f), idx))
    return samples, class_names

def collect_paddy_doctor_samples():
    classes = sorted([d for d in os.listdir(PADDY_DATASET) if os.path.isdir(os.path.join(PADDY_DATASET, d)) and not d.startswith('.')])
    samples = []
    for idx, c in enumerate(classes):
        c_dir = os.path.join(PADDY_DATASET, c)
        imgs = [os.path.join(c_dir, f) for f in os.listdir(c_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))][:100]
        for f in imgs:
            samples.append((f, idx))
    return samples, classes

if __name__ == "__main__":
    t0 = time.time()
    # 1. Rice from Rice_and_Maize_Dataset
    rice_s, rice_c = collect_crop_samples("Rice")
    rice_rep = train_and_eval_cv("Rice (New Dataset)", rice_s, rice_c, n_splits=5, epochs=15, patience=2)
    
    # 2. Maize from Rice_and_Maize_Dataset
    maize_s, maize_c = collect_crop_samples("Maize")
    maize_rep = train_and_eval_cv("Maize (New Dataset)", maize_s, maize_c, n_splits=5, epochs=15, patience=2)
    
    # 3. Paddy Doctor
    paddy_s, paddy_c = collect_paddy_doctor_samples()
    paddy_rep = train_and_eval_cv("Paddy Doctor (10-Class)", paddy_s, paddy_c, n_splits=5, epochs=15, patience=2)
    
    print("\n=======================================================")
    print("           ALL DATASETS CV EVALUATION COMPLETE         ")
    print("=======================================================")
    print(f"1. Rice (New Dataset)     : {rice_rep['mean_accuracy']*100:.2f}% (+/- {rice_rep['std_accuracy']*100:.2f}%)")
    print(f"2. Maize (New Dataset)    : {maize_rep['mean_accuracy']*100:.2f}% (+/- {maize_rep['std_accuracy']*100:.2f}%)")
    print(f"3. Paddy Doctor (10-Class): {paddy_rep['mean_accuracy']*100:.2f}% (+/- {paddy_rep['std_accuracy']*100:.2f}%)")
    print(f"Total time elapsed: {(time.time() - t0)/60:.2f} min")
