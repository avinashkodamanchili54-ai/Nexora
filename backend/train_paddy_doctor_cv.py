import os
import sys
import json
import time
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, Subset
from torchvision import models, transforms
from sklearn.model_selection import StratifiedKFold

DATASET_ROOT = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/source/paddy-disease-classification/train_images"
OUTPUT_DIR = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/models/trained_paddy_doctor"
os.makedirs(OUTPUT_DIR, exist_ok=True)

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Paddy Doctor CV using device: {device}")

PADDY_CLASSES = sorted([
    "bacterial_leaf_blight",
    "bacterial_leaf_streak",
    "bacterial_panicle_blight",
    "blast",
    "brown_spot",
    "dead_heart",
    "downy_mildew",
    "hispa",
    "normal",
    "tungro"
])

class PaddyFlatDataset(Dataset):
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

def load_paddy_samples(max_per_class=120):
    samples = []
    print("Collecting Paddy Doctor samples...")
    for cls_idx, cls_name in enumerate(PADDY_CLASSES):
        cls_dir = os.path.join(DATASET_ROOT, cls_name)
        if not os.path.exists(cls_dir):
            continue
        all_imgs = [os.path.join(cls_dir, f) for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        # Stratified balance subset per class to ensure fast, high-quality CV convergence
        selected = all_imgs[:max_per_class]
        for p in selected:
            samples.append((p, cls_idx))
        print(f"  [{cls_idx}] {cls_name}: {len(selected)} images selected (out of {len(all_imgs)})")
    return samples

train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def train_paddy_doctor_cv(n_splits=5, epochs=15, batch_size=32, patience=2):
    print(f"\n=======================================================")
    print(f"   STARTING PADDY DOCTOR {n_splits}-FOLD CROSS VALIDATION")
    print(f"=======================================================")
    
    samples = load_paddy_samples(max_per_class=120)
    labels = [s[1] for s in samples]
    print(f"Total dataset: {len(samples)} images across {len(PADDY_CLASSES)} classes.")
    
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    fold_accuracies = []
    best_overall_acc = 0.0
    best_model_path = os.path.join(OUTPUT_DIR, "paddy_doctor_best_cv_model.pt")
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(samples, labels)):
        print(f"\n--- Paddy Doctor: Fold {fold + 1}/{n_splits} ---")
        
        train_samples = [samples[i] for i in train_idx]
        val_samples = [samples[i] for i in val_idx]
        
        train_dataset = PaddyFlatDataset(train_samples, transform=train_transform)
        val_dataset = PaddyFlatDataset(val_samples, transform=val_transform)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
        
        # MobileNetV2 architecture
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(in_features, len(PADDY_CLASSES))
        )
        model = model.to(device)
        
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
        
        best_val_acc = 0.0
        epochs_without_improvement = 0
        
        for epoch in range(1, epochs + 1):
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            
            for imgs, lbls in train_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                optimizer.zero_grad()
                outputs = model(imgs)
                loss = criterion(outputs, lbls)
                loss.backward()
                optimizer.step()
                
                running_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                correct += (preds == lbls).sum().item()
                total += lbls.size(0)
                
            scheduler.step()
            train_acc = correct / total
            
            # Validation
            model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0
            
            with torch.no_grad():
                for imgs, lbls in val_loader:
                    imgs, lbls = imgs.to(device), lbls.to(device)
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)
                    val_loss += loss.item() * imgs.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_correct += (preds == lbls).sum().item()
                    val_total += lbls.size(0)
                    
            val_acc = val_correct / val_total
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | Loss: {val_loss/val_total:.4f}")
            
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                epochs_without_improvement = 0
                if val_acc > best_overall_acc:
                    best_overall_acc = val_acc
                    torch.save({
                        'model_state_dict': model.state_dict(),
                        'classes': PADDY_CLASSES,
                        'val_acc': val_acc,
                    }, best_model_path)
            else:
                epochs_without_improvement += 1
                if epochs_without_improvement >= patience:
                    print(f"--> Early stopping Fold {fold + 1} at Epoch {epoch:02d} (no val accuracy improvement for {patience} epochs)")
                    break
                    
        fold_accuracies.append(best_val_acc)
        print(f"Paddy Doctor Fold {fold + 1} Best Val Acc: {best_val_acc*100:.2f}%")
        
    mean_acc = np.mean(fold_accuracies)
    std_acc = np.std(fold_accuracies)
    print(f"\n>> Paddy Doctor 10-Class {n_splits}-Fold Mean Accuracy: {mean_acc*100:.2f}% (+/- {std_acc*100:.2f}%)")
    
    report = {
        "dataset": "Paddy Doctor (10-Class)",
        "n_splits": n_splits,
        "epochs_per_fold": epochs,
        "classes": PADDY_CLASSES,
        "fold_accuracies": [round(float(a), 4) for a in fold_accuracies],
        "mean_accuracy": round(float(mean_acc), 4),
        "std_accuracy": round(float(std_acc), 4),
        "best_overall_accuracy": round(float(best_overall_acc), 4),
        "model_path": best_model_path
    }
    
    report_file = os.path.join(OUTPUT_DIR, "paddy_doctor_cv_report.json")
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
        
    return report

if __name__ == "__main__":
    t0 = time.time()
    train_paddy_doctor_cv(n_splits=5, epochs=15, batch_size=32, patience=2)
    print(f"Paddy Doctor CV finished in {(time.time() - t0)/60:.2f} minutes.")
